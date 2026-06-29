import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardCheck, Check, X, Pencil, ArrowRight, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useTaskMutations } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiError, apiErrors } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Task } from '@/lib/types';

export function ReviewsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const scope: 'manager' | 'admin' = isAdmin ? 'admin' : 'manager';
  const { data: tasks, isLoading } = useTasks({ queue: scope });
  const m = useTaskMutations();

  const [action, setAction] = useState<{ task: Task; decision: 'changes' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');

  const submit = async () => {
    if (!action) return;
    if (!comment.trim()) return toast.error('A comment is required');
    try {
      const payload = { id: action.task._id, decision: action.decision, comment };
      if (scope === 'manager') await m.managerReview.mutateAsync(payload);
      else await m.adminReview.mutateAsync(payload);
      toast.success(action.decision === 'reject' ? 'Submission rejected' : 'Changes requested');
      setAction(null); setComment('');
    } catch (e) {
      const errs = apiErrors(e);
      if (errs.length) errs.forEach((msg) => toast.error(msg));
      else toast.error(apiError(e));
    }
  };

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Pending Final Approvals' : 'Pending Reviews'}
        description={
          isAdmin
            ? 'Tasks approved by managers awaiting your final sign-off.'
            : 'Work submitted by your team awaiting review.'
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : !tasks?.length ? (
        <EmptyState icon={ClipboardCheck} title="You're all caught up" description={isAdmin ? 'No tasks are awaiting final approval.' : 'No submissions are waiting for your review.'} />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <Card key={t._id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    {t.taskCode && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                        <Hash className="h-3 w-3" />{t.taskCode}
                      </span>
                    )}
                    {t.project && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="h-2 w-2 rounded-sm" style={{ background: t.project.color }} />{t.project.name}
                      </span>
                    )}
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <Link to={`/tasks/${t._id}`} className="font-semibold text-foreground hover:text-primary">{t.title}</Link>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {t.assignedTo && (
                      <span className="inline-flex items-center gap-1.5"><Avatar name={t.assignedTo.name} size="xs" />{t.assignedTo.name}</span>
                    )}
                    <span>Due {formatDate(t.dueDate)}</span>
                    <span className="inline-flex items-center gap-2">Progress <span className="w-24"><ProgressBar value={t.progress} /></span> {t.progress}%</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAction({ task: t, decision: 'changes' })}><Pencil className="h-4 w-4" /> Request Changes</Button>
                  <Button variant="danger" size="sm" onClick={() => setAction({ task: t, decision: 'reject' })}><X className="h-4 w-4" /> Reject</Button>
                  <Link to={`/tasks/${t._id}`}>
                    <Button size="sm"><Check className="h-4 w-4" /> Review & Approve <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action?.decision === 'reject' ? 'Reject Submission' : 'Request Changes'}
        description="A comment is required. The assignee will be notified and the task unlocked for rework."
        footer={
          <>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button variant="danger" onClick={submit} loading={m.managerReview.isPending || m.adminReview.isPending}>
              {action?.decision === 'reject' ? 'Reject' : 'Request Changes'}
            </Button>
          </>
        }
      >
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Describe what needs to change…" autoFocus />
      </Modal>
    </div>
  );
}
