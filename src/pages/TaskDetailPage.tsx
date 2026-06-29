import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, Paperclip, Send, Check, X, Play, Save,
  Upload, MessageSquare, Trash2, FileText, ListChecks, Plus, Download, Pencil,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask, useTaskMutations, useActivity } from '@/hooks/queries';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FieldGroup } from '@/components/ui/Field';
import { PRIORITIES } from '@/lib/constants';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkflowStepper } from '@/components/shared/WorkflowStepper';
import { TaskFormModal } from '@/components/shared/TaskFormModal';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { TaskCard } from '@/components/shared/TaskCard';
import { cn, formatDate, formatDateTime, timeAgo, isOverdue } from '@/lib/utils';
import { progressColor } from '@/lib/constants';
import { apiError } from '@/lib/api';

const PROGRESS_STEPS = [0, 30, 60, 90, 100];

export function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: task, isLoading } = useTask(id);
  const { data: activity } = useActivity({ task: id, limit: '20' });
  const m = useTaskMutations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [comment, setComment] = useState('');
  const [review, setReview] = useState<{ type: 'manager' | 'admin'; decision: 'approve' | 'reject' } | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium', startDate: '', dueDate: '', instructions: '' });
  const [newItem, setNewItem] = useState('');

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
  const canWork = isEmployee && isAssignee && !['completed', 'sent_to_admin', 'manager_approved', 'submitted_for_review'].includes(task.status);
  const isCreator = task.assignedBy?._id === user?._id;
  const canEditTask = isAdmin || (isManager && isCreator);
  const fmt = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

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
      if (value >= 100) {
        await m.submit.mutateAsync(task._id);
        toast.success('Task submitted for manager review');
      } else {
        await m.progress.mutateAsync({ id: task._id, progress: value });
        toast.success(`Progress updated to ${value}%`);
      }
    } catch (e) { toast.error(apiError(e)); }
  };

  const handleAccept = async () => {
    try { await m.accept.mutateAsync(task._id); toast.success('Task accepted — let\'s get to work!'); }
    catch (e) { toast.error(apiError(e)); }
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
    try {
      const payload = { id: task._id, decision: review.decision, comment: reviewComment };
      if (review.type === 'manager') await m.managerReview.mutateAsync(payload);
      else await m.adminReview.mutateAsync(payload);
      toast.success(review.decision === 'approve' ? 'Work approved' : 'Changes requested');
      setReview(null); setReviewComment('');
    } catch (e) { toast.error(apiError(e)); }
  };

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

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
              <Meta label="Assigned by" value={task.assignedBy?.name} avatar={task.assignedBy?.name} />
              <Meta label="Assigned to" value={task.assignedTo?.name} avatar={task.assignedTo?.name} />
              <Meta label="Start date" value={formatDate(task.startDate)} icon={<Calendar className="h-3.5 w-3.5" />} />
              <Meta label="Due date" value={formatDate(task.dueDate)} icon={<Calendar className="h-3.5 w-3.5" />} danger={overdue} />
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
                {!task.accepted && task.status === 'assigned' ? (
                  <Button onClick={handleAccept} loading={m.accept.isPending}><Play className="h-4 w-4" /> Accept Task</Button>
                ) : (
                  <>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Update your progress</p>
                    <div className="flex flex-wrap gap-2">
                      {PROGRESS_STEPS.map((step) => (
                        <button
                          key={step}
                          onClick={() => setProgress(step)}
                          className={cn(
                            'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all min-w-[64px]',
                            task.progress === step
                              ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                              : 'border-border bg-surface text-foreground hover:border-primary hover:bg-accent'
                          )}
                        >
                          {step === 100 ? '✓ 100%' : `${step}%`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => m.progress.mutate({ id: task._id, progress: task.progress, isDraft: true })}>
                        <Save className="h-4 w-4" /> Save Draft
                      </Button>
                      {task.progress >= 100 && (
                        <Button size="sm" onClick={() => setProgress(100)}><Send className="h-4 w-4" /> Submit for Review</Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Rework banner */}
            {(task.status === 'manager_rejected' || task.status === 'admin_rejected') && isAssignee && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Changes requested — please rework and resubmit.</p>
                {task.managerReview?.comment && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">"{task.managerReview.comment}"</p>}
              </div>
            )}

            {/* Manager review actions */}
            {canManagerReview && (
              <div className="mt-5 flex gap-2 border-t border-border pt-5">
                <Button variant="success" onClick={() => setReview({ type: 'manager', decision: 'approve' })}><Check className="h-4 w-4" /> Approve & Send to Admin</Button>
                <Button variant="danger" onClick={() => setReview({ type: 'manager', decision: 'reject' })}><X className="h-4 w-4" /> Request Changes</Button>
              </div>
            )}

            {/* Admin review actions */}
            {canAdminReview && (
              <div className="mt-5 flex gap-2 border-t border-border pt-5">
                <Button variant="success" onClick={() => setReview({ type: 'admin', decision: 'approve' })}><Check className="h-4 w-4" /> Final Approval</Button>
                <Button variant="danger" onClick={() => setReview({ type: 'admin', decision: 'reject' })}><X className="h-4 w-4" /> Reject (Rework)</Button>
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

          {/* Checklist */}
          {(task.checklist?.length > 0 || canEditTask) && (
            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Checklist</span>}
                subtitle={task.checklist?.length ? `${task.checklist.filter((c) => c.done).length} of ${task.checklist.length} complete` : 'No items yet'} />
              <div className="divide-y divide-border">
                {task.checklist.map((item) => (
                  <div key={item._id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                    <button
                      onClick={() => isAssignee && m.toggleChecklist.mutate({ id: task._id, itemId: item._id })}
                      disabled={!isAssignee}
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
        title={review?.decision === 'approve' ? 'Approve Work' : 'Request Changes'}
        description={review?.decision === 'approve' ? 'Confirm approval and add an optional note.' : 'Let the assignee know what needs to change.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setReview(null)}>Cancel</Button>
            <Button variant={review?.decision === 'approve' ? 'success' : 'danger'} onClick={submitReview} loading={m.managerReview.isPending || m.adminReview.isPending}>
              {review?.decision === 'approve' ? 'Approve' : 'Request Changes'}
            </Button>
          </>
        }
      >
        <Textarea
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder={review?.decision === 'approve' ? 'Optional note…' : 'Describe the required changes…'}
        />
      </Modal>

      <TaskFormModal open={subtaskOpen} onClose={() => setSubtaskOpen(false)} parentTaskId={task._id} defaultProject={task.project?._id} />

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
