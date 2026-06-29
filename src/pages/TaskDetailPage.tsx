import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, Paperclip, Send, Check, X, Play, Pause, Save,
  Upload, MessageSquare, Trash2, FileText, ListChecks, Plus, Download, Pencil,
  Clock, Hand, ShieldCheck, Hash, GitBranch, Timer,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask, useTaskMutations, useActivity } from '@/hooks/queries';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FieldGroup } from '@/components/ui/Field';
import { PRIORITIES } from '@/lib/constants';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge, PriorityBadge, Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkflowStepper } from '@/components/shared/WorkflowStepper';
import { TaskFormModal } from '@/components/shared/TaskFormModal';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { TaskCard } from '@/components/shared/TaskCard';
import { cn, formatDate, timeAgo, isOverdue } from '@/lib/utils';
import { progressColor } from '@/lib/constants';
import { apiError, apiErrors } from '@/lib/api';

const PROGRESS_STEPS = [0, 30, 60, 90, 100];

function formatDuration(minutes?: number) {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: task, isLoading } = useTask(id);
  const { data: activity } = useActivity({ task: id, limit: '20' });
  const m = useTaskMutations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [comment, setComment] = useState('');
  const [review, setReview] = useState<{ type: 'manager' | 'admin'; decision: 'approve' | 'changes' | 'reject' } | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium', startDate: '', dueDate: '', instructions: '' });
  const [newItem, setNewItem] = useState('');
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (!task) return <EmptyState title="Task not found" description="This task may have been removed." />;

  const isAssignee = task.assignedTo?._id === user?._id;
  const isEmployee = user?.role === 'employee';
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const pc = progressColor(task.progress);
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';

  const canManagerReview = isManager && task.status === 'submitted_for_review';
  const canAdminReview = isAdmin && task.status === 'sent_to_admin';
  const managerChecklist = task.managerChecklist ?? [];
  const adminChecklist = task.adminChecklist ?? [];
  const managerChecklistDone = managerChecklist.length > 0 && managerChecklist.every((c) => c.done);
  const adminChecklistDone = adminChecklist.length > 0 && adminChecklist.every((c) => c.done);
  // The assignee can work unless the task is in a review/terminal state.
  const inReviewOrDone = ['completed', 'sent_to_admin', 'manager_approved', 'submitted_for_review'].includes(task.status);
  const canWork = (isEmployee || isAdmin) && isAssignee && !inReviewOrDone;
  const isCreator = task.assignedBy?._id === user?._id;
  const canEditTask = (isAdmin || (isManager && isCreator)) && !task.locked;
  const fmt = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  const needsAccept = !task.accepted && ['assigned', 'not_started', 'declined'].includes(task.status);
  const canStart = task.accepted && task.status === 'accepted';
  const isPaused = task.status === 'paused';
  const isWorking = task.status === 'in_progress';
  const isRework = task.status === 'manager_rejected' || task.status === 'admin_rejected';
  const criteria = task.acceptanceCriteria ?? [];
  const mandatoryLeft = (task.checklist ?? []).filter((c) => c.required !== false && !c.done).length;
  const criteriaLeft = criteria.filter((c) => !c.acknowledged).length;
  const submitBlockers = [
    task.progress < 100 && 'progress at 100%',
    mandatoryLeft > 0 && `${mandatoryLeft} checklist item(s)`,
    (task.attachments?.length ?? 0) === 0 && 'a deliverable',
    criteriaLeft > 0 && `${criteriaLeft} acceptance criteria`,
  ].filter(Boolean) as string[];
  const canSubmit = submitBlockers.length === 0;

  const openEdit = () => {
    setEditForm({
      title: task.title, description: task.description || '', priority: task.priority,
      startDate: fmt(task.startDate), dueDate: fmt(task.dueDate), instructions: task.instructions || '',
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return toast.error('Title is required');
    try {
      await m.update.mutateAsync({ id: task._id, body: editForm as any });
      toast.success('Task updated');
      setEditOpen(false);
    } catch (e) { toast.error(apiError(e)); }
  };

  const addChecklistItem = async () => {
    if (!newItem.trim()) return;
    const checklist = [
      ...task.checklist.map((c) => ({ _id: c._id, text: c.text, done: c.done })),
      { text: newItem.trim(), done: false },
    ];
    try {
      await m.update.mutateAsync({ id: task._id, body: { checklist } as any });
      setNewItem('');
    } catch (e) { toast.error(apiError(e)); }
  };

  const removeChecklistItem = async (itemId: string) => {
    const checklist = task.checklist.filter((c) => c._id !== itemId).map((c) => ({ _id: c._id, text: c.text, done: c.done }));
    try {
      await m.update.mutateAsync({ id: task._id, body: { checklist } as any });
    } catch (e) { toast.error(apiError(e)); }
  };

  const setProgress = async (value: number) => {
    try {
      await m.progress.mutateAsync({ id: task._id, progress: value });
      toast.success(`Progress updated to ${value}%`);
    } catch (e) { toast.error(apiError(e)); }
  };

  const handleSubmit = async () => {
    try {
      await m.submit.mutateAsync(task._id);
      toast.success('Task submitted for manager review');
    } catch (e) {
      const errs = apiErrors(e);
      if (errs.length) errs.forEach((msg) => toast.error(msg));
      else toast.error(apiError(e, 'Could not submit task'));
    }
  };

  const handleAccept = async () => {
    try { await m.accept.mutateAsync(task._id); toast.success('Task accepted'); }
    catch (e) { toast.error(apiError(e)); }
  };

  const handleStart = async () => {
    try { await m.start.mutateAsync(task._id); toast.success('Timer started — task in progress'); }
    catch (e) { toast.error(apiError(e)); }
  };

  const handlePause = async () => {
    try { await m.pause.mutateAsync(task._id); toast.success('Task paused'); }
    catch (e) { toast.error(apiError(e)); }
  };

  const handleResume = async () => {
    try { await m.resume.mutateAsync(task._id); toast.success('Task resumed'); }
    catch (e) { toast.error(apiError(e)); }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return toast.error('Please provide a reason');
    try {
      await m.decline.mutateAsync({ id: task._id, reason: declineReason.trim() });
      toast.success('Task declined — your manager has been notified');
      setDeclineOpen(false); setDeclineReason('');
    } catch (e) { toast.error(apiError(e)); }
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try { await m.upload.mutateAsync({ id: task._id, file }); toast.success('File uploaded'); }
    catch (e) { toast.error(apiError(e)); }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    try { await m.comment.mutateAsync({ id: task._id, text: comment }); setComment(''); }
    catch (e) { toast.error(apiError(e)); }
  };

  const submitReview = async () => {
    if (!review) return;
    if (review.decision !== 'approve' && !reviewComment.trim()) return toast.error('A comment is required');
    try {
      const payload = { id: task._id, decision: review.decision, comment: reviewComment };
      if (review.type === 'manager') await m.managerReview.mutateAsync(payload);
      else await m.adminReview.mutateAsync(payload);
      const msg = review.decision === 'approve'
        ? (review.type === 'manager' ? 'Approved & sent to Admin' : 'Final approval granted — task completed')
        : review.decision === 'reject' ? 'Submission rejected' : 'Changes requested';
      toast.success(msg);
      setReview(null); setReviewComment('');
    } catch (e) {
      const errs = apiErrors(e);
      if (errs.length) errs.forEach((msg) => toast.error(msg));
      else toast.error(apiError(e));
    }
  };

  const handleSaveChanges = async () => {
    try {
      await m.progress.mutateAsync({ id: task._id, progress: task.progress, isDraft: true });
      toast.success('Changes saved');
    } catch (e) { toast.error(apiError(e, 'Could not save changes')); }
  };

  const toggleReviewItem = (scope: 'manager' | 'admin', itemId: string) =>
    m.toggleReviewItem.mutate({ id: task._id, scope, itemId });

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {task.taskCode && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                  <Hash className="h-3 w-3" />{task.taskCode}
                </span>
              )}
              {task.project && (
                <Link to="/tasks" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ background: task.project.color }} />
                  {task.project.name}
                </Link>
              )}
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {task.type === 'admin_task' ? 'Manager Deliverable' : 'Subtask'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">{task.title}</h1>
              {canEditTask && (
                <Button variant="outline" size="sm" onClick={openEdit} className="shrink-0"><Pencil className="h-4 w-4" /> Edit</Button>
              )}
            </div>
            {task.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.description}</p>}

            {!!task.tags?.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {task.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
              <Meta label="Assigned by" value={task.assignedBy?.name} avatar={task.assignedBy?.name} />
              <Meta label="Assigned to" value={task.assignedTo?.name} avatar={task.assignedTo?.name} />
              <Meta label="Start date" value={formatDate(task.startDate)} icon={<Calendar className="h-3.5 w-3.5" />} />
              <Meta label="Due date" value={formatDate(task.dueDate)} icon={<Calendar className="h-3.5 w-3.5" />} danger={overdue} />
              {!!task.estimatedHours && <Meta label="Estimated" value={`${task.estimatedHours}h`} icon={<Clock className="h-3.5 w-3.5" />} />}
              <Meta label="Time tracked" value={formatDuration(task.timeWorked)} icon={<Timer className="h-3.5 w-3.5" />} />
            </div>
          </Card>

          {/* Progress + employee controls */}
          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">Progress</h3>
              <span className={cn('text-sm font-semibold', pc.text)}>{pc.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={task.progress} className="h-3" />
              <span className="w-12 text-right text-lg font-bold text-foreground">{task.progress}%</span>
            </div>

            {canWork && (
              <div className="mt-5">
                {/* Rework banner */}
                {isRework && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Changes requested — please rework and resubmit.</p>
                    {(task.adminReview?.status === 'rejected' ? task.adminReview?.comment : task.managerReview?.comment) && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">"{task.adminReview?.status === 'rejected' ? task.adminReview?.comment : task.managerReview?.comment}"</p>
                    )}
                  </div>
                )}

                {needsAccept ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleAccept} loading={m.accept.isPending}><Check className="h-4 w-4" /> Accept Task</Button>
                    <Button variant="outline" onClick={() => setDeclineOpen(true)}><Hand className="h-4 w-4" /> Decline</Button>
                  </div>
                ) : canStart ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleStart} loading={m.start.isPending}><Play className="h-4 w-4" /> Start Task</Button>
                    <Button variant="outline" onClick={() => setDeclineOpen(true)}><Hand className="h-4 w-4" /> Decline</Button>
                  </div>
                ) : isPaused ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Task is paused. Resume to continue tracking time.</p>
                      <Button size="sm" onClick={handleResume} loading={m.resume.isPending}><Play className="h-4 w-4" /> Resume</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Update your progress</p>
                      {isWorking && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Timer running
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PROGRESS_STEPS.map((step) => (
                        <button
                          key={step}
                          onClick={() => setProgress(step)}
                          className={cn(
                            'min-w-[64px] flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all',
                            task.progress === step
                              ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                              : 'border-border bg-surface text-foreground hover:border-primary hover:bg-accent'
                          )}
                        >
                          {step === 100 ? '✓ 100%' : `${step}%`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleSaveChanges} loading={m.progress.isPending}>
                        <Save className="h-4 w-4" /> Save Changes
                      </Button>
                      {isWorking && (
                        <Button variant="outline" size="sm" onClick={handlePause} loading={m.pause.isPending}><Pause className="h-4 w-4" /> Pause</Button>
                      )}
                      <Button size="sm" onClick={handleSubmit} loading={m.submit.isPending} disabled={!canSubmit} title={canSubmit ? 'Submit for review' : `Still required: ${submitBlockers.join(', ')}`}>
                        <Send className="h-4 w-4" /> Submit for Review
                      </Button>
                    </div>
                    {!canSubmit && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Before submitting: <span className="font-medium text-foreground">{submitBlockers.join(', ')}</span>.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Manager review actions */}
            {canManagerReview && (
              <div className="mt-5 border-t border-border pt-5">
                <ReviewChecklist
                  title="Review Checklist"
                  items={managerChecklist}
                  onToggle={(itemId) => toggleReviewItem('manager', itemId)}
                />
                {!managerChecklistDone && (
                  <p className="mb-3 text-xs text-muted-foreground">Complete every review item to enable approval.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => setReview({ type: 'manager', decision: 'approve' })} disabled={!managerChecklistDone} title={managerChecklistDone ? 'Approve & send to Admin' : 'Complete the review checklist first'}>
                    <Check className="h-4 w-4" /> Approve & Send to Admin
                  </Button>
                  <Button variant="outline" onClick={() => setReview({ type: 'manager', decision: 'changes' })}><Pencil className="h-4 w-4" /> Request Changes</Button>
                  <Button variant="danger" onClick={() => setReview({ type: 'manager', decision: 'reject' })}><X className="h-4 w-4" /> Reject</Button>
                </div>
              </div>
            )}

            {/* Admin review actions */}
            {canAdminReview && (
              <div className="mt-5 border-t border-border pt-5">
                <ReviewChecklist
                  title="Final Approval Checklist"
                  items={adminChecklist}
                  onToggle={(itemId) => toggleReviewItem('admin', itemId)}
                />
                {!adminChecklistDone && (
                  <p className="mb-3 text-xs text-muted-foreground">Complete every item to enable final approval.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => setReview({ type: 'admin', decision: 'approve' })} disabled={!adminChecklistDone} title={adminChecklistDone ? 'Grant final approval' : 'Complete the checklist first'}>
                    <Check className="h-4 w-4" /> Final Approval
                  </Button>
                  <Button variant="outline" onClick={() => setReview({ type: 'admin', decision: 'changes' })}><Pencil className="h-4 w-4" /> Request Changes</Button>
                  <Button variant="danger" onClick={() => setReview({ type: 'admin', decision: 'reject' })}><X className="h-4 w-4" /> Reject (Rework)</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Instructions */}
          {task.instructions && (
            <Card>
              <CardHeader title="Instructions" />
              <div className="p-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{task.instructions}</div>
            </Card>
          )}

          {/* Acceptance criteria */}
          {criteria.length > 0 && (
            <Card>
              <CardHeader
                title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Acceptance Criteria</span>}
                subtitle={`${criteria.filter((c) => c.acknowledged).length} of ${criteria.length} acknowledged`}
              />
              <div className="divide-y divide-border">
                {criteria.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => isAssignee && !inReviewOrDone && m.acknowledgeCriterion.mutate({ id: task._id, critId: c._id })}
                    disabled={!isAssignee || inReviewOrDone}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', c.acknowledged ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border')}>
                      {c.acknowledged && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={cn('text-sm', c.acknowledged ? 'text-foreground' : 'text-muted-foreground')}>{c.text}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Dependencies */}
          {!!task.dependencies?.length && (
            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> Dependencies</span>} subtitle="This task depends on" />
              <div className="divide-y divide-border">
                {task.dependencies.map((d) => (
                  <Link key={d._id} to={`/tasks/${d._id}`} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/40">
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      {d.taskCode && <span className="font-mono text-xs text-muted-foreground">{d.taskCode}</span>}
                      {d.title}
                    </span>
                    <StatusBadge status={d.status} />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Checklist */}
          {(task.checklist?.length > 0 || canEditTask) && (
            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Checklist</span>}
                subtitle={task.checklist?.length ? `${task.checklist.filter((c) => c.done).length} of ${task.checklist.length} complete · ${Math.round((task.checklist.filter((c) => c.done).length / task.checklist.length) * 100)}%` : 'No items yet'} />
              <div className="divide-y divide-border">
                {task.checklist.map((item) => (
                  <div key={item._id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                    <button
                      onClick={() => canWork && m.toggleChecklist.mutate({ id: task._id, itemId: item._id })}
                      disabled={!canWork}
                      className="flex flex-1 items-center gap-3 text-left disabled:cursor-default"
                    >
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', item.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border')}>
                        {item.done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className={cn('text-sm', item.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{item.text}</span>
                    </button>
                    {canEditTask && (
                      <button onClick={() => removeChecklistItem(item._id)} className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canEditTask && (
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add a checklist item…"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} className="h-9" />
                  <Button size="sm" onClick={addChecklistItem} loading={m.update.isPending} disabled={!newItem.trim()}><Plus className="h-4 w-4" /> Add</Button>
                </div>
              )}
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Attachments</span>}
              action={<Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={m.upload.isPending}><Upload className="h-4 w-4" /> Upload</Button>}
            />
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
            <div className="p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files?.[0]); }}
                className={cn('mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors', dragOver ? 'border-primary bg-accent' : 'border-border')}
              >
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop files here, or <button onClick={() => fileRef.current?.click()} className="font-medium text-primary hover:underline">browse</button></p>
              </div>
              {task.attachments?.length ? (
                <div className="space-y-2">
                  {task.attachments.map((a) => (
                    <a key={a._id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.uploadedBy?.name} · {timeAgo(a.createdAt)}</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">No attachments yet.</p>
              )}
            </div>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</span>} subtitle={`${task.comments?.length || 0} comments`} />
            <div className="p-5">
              <div className="mb-4 flex gap-3">
                <Avatar name={user?.name} size="sm" />
                <div className="flex-1">
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment… use @ to mention" className="min-h-[70px]" />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={submitComment} loading={m.comment.isPending} disabled={!comment.trim()}><Send className="h-4 w-4" /> Comment</Button>
                  </div>
                </div>
              </div>
              {task.comments?.length ? (
                <div className="space-y-4">
                  {[...task.comments].reverse().map((c) => (
                    <div key={c._id} className="flex gap-3">
                      <Avatar name={c.author?.name} size="sm" />
                      <div className="flex-1 rounded-xl rounded-tl-sm bg-muted/50 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{c.author?.name}</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-foreground">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">Be the first to comment.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-5 font-display font-semibold text-foreground">Approval Workflow</h3>
            <WorkflowStepper task={task} />
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <ReviewRow label="Manager review" review={task.managerReview} />
              <ReviewRow label="Admin review" review={task.adminReview} />
            </div>
          </Card>

          {/* Subtasks (for admin tasks / managers) */}
          {(task.type === 'admin_task' || task.subtasks?.length) && (
            <Card>
              <CardHeader
                title="Subtasks"
                subtitle={`${task.subtasks?.length || 0} items`}
                action={isManager && isAssignee ? <Button size="sm" variant="outline" onClick={() => setSubtaskOpen(true)}><Plus className="h-4 w-4" /> Add</Button> : undefined}
              />
              <div className="space-y-3 p-4">
                {task.subtasks?.length ? task.subtasks.map((s, i) => <TaskCard key={s._id} task={s} index={i} />) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No subtasks yet.</p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Task Activity" />
            <div className="p-4">
              {activity?.length ? <ActivityFeed items={activity} compact /> : <p className="py-4 text-center text-sm text-muted-foreground">No activity yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Review modal */}
      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={review?.decision === 'approve' ? 'Approve Work' : review?.decision === 'reject' ? 'Reject Submission' : 'Request Changes'}
        description={
          review?.decision === 'approve'
            ? 'Confirm approval and add an optional note.'
            : review?.decision === 'reject'
            ? 'Explain why this submission is being rejected. A comment is required.'
            : 'Let the assignee know what needs to change. A comment is required.'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setReview(null)}>Cancel</Button>
            <Button variant={review?.decision === 'approve' ? 'success' : 'danger'} onClick={submitReview} loading={m.managerReview.isPending || m.adminReview.isPending}>
              {review?.decision === 'approve' ? 'Approve' : review?.decision === 'reject' ? 'Reject' : 'Request Changes'}
            </Button>
          </>
        }
      >
        <Textarea
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder={review?.decision === 'approve' ? 'Optional note…' : 'Describe the required changes…'}
          autoFocus
        />
      </Modal>

      <TaskFormModal open={subtaskOpen} onClose={() => setSubtaskOpen(false)} parentTaskId={task._id} defaultProject={task.project?._id} />

      {/* Decline modal */}
      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline Task"
        description="Let your manager know why you can't take this on. They'll be notified."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDecline} loading={m.decline.isPending}>Decline Task</Button>
          </>
        }
      >
        <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for declining…" autoFocus />
      </Modal>

      {/* Edit task modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="lg"
        title="Edit Task"
        description="Update the task's details. Progress and workflow status are unaffected."
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveEdit} loading={m.update.isPending}>Save Changes</Button></>}
      >
        <div className="space-y-4">
          <FieldGroup label="Title"><Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} required /></FieldGroup>
          <FieldGroup label="Description"><Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} /></FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FieldGroup label="Priority">
              <Select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="Start date"><Input type="date" value={editForm.startDate} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} /></FieldGroup>
            <FieldGroup label="Due date"><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} /></FieldGroup>
          </div>
          <FieldGroup label="Instructions"><Textarea value={editForm.instructions} onChange={(e) => setEditForm((f) => ({ ...f, instructions: e.target.value }))} className="min-h-[70px]" /></FieldGroup>
        </div>
      </Modal>
    </div>
  );
}

function Meta({ label, value, avatar, icon, danger }: { label: string; value?: string; avatar?: string; icon?: React.ReactNode; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className={cn('mt-1 flex items-center gap-1.5 text-sm font-medium', danger ? 'text-danger' : 'text-foreground')}>
        {avatar && <Avatar name={avatar} size="xs" />}
        {icon}
        <span>{value || '—'}</span>
      </div>
    </div>
  );
}

function ReviewChecklist({ title, items, onToggle }: { title: string; items: { _id: string; text: string; done: boolean }[]; onToggle: (id: string) => void }) {
  if (!items.length) return null;
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className={cn('text-xs font-semibold', pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>{done}/{items.length} · {pct}%</span>
      </div>
      <div className="space-y-1">
        {items.map((i) => (
          <button key={i._id} onClick={() => onToggle(i._id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60">
            <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', i.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border')}>
              {i.done && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className={cn('text-sm', i.done ? 'text-foreground' : 'text-muted-foreground')}>{i.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ label, review }: { label: string; review?: { status: string; comment?: string; reviewedBy?: { name: string }; reviewedAt?: string } }) {
  const status = review?.status || 'pending';
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1.5 font-medium',
        status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : status === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-rose-500' : 'bg-slate-400')} />
        {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
      </span>
    </div>
  );
}
