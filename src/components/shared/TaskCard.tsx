import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Paperclip, AlertTriangle } from 'lucide-react';
import type { Task } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { progressColor } from '@/lib/constants';

export function TaskCard({ task, index = 0 }: { task: Task; index?: number }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
  const pc = progressColor(task.progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to={`/tasks/${task._id}`}
        className="group block rounded-xl border border-border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              {task.project && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ background: task.project.color }} />
                  {task.project.key || task.project.name}
                </span>
              )}
              <PriorityBadge priority={task.priority} />
            </div>
            <h3 className="truncate font-semibold text-foreground group-hover:text-primary">{task.title}</h3>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        )}

        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={cn('font-medium', pc.text)}>{pc.label}</span>
            <span className="font-semibold text-foreground">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={cn('flex items-center gap-1', overdue && 'font-medium text-danger')}>
              {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
              {formatDate(task.dueDate)}
            </span>
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{task.comments.length}</span>
            )}
            {task.attachments?.length > 0 && (
              <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{task.attachments.length}</span>
            )}
          </div>
          {task.assignedTo && <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar} size="xs" />}
        </div>
      </Link>
    </motion.div>
  );
}
