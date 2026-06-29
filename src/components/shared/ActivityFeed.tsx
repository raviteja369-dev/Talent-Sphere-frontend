import { motion } from 'framer-motion';
import {
  UserPlus, FolderPlus, CheckCircle2, XCircle, MessageSquare,
  Upload, TrendingUp, Send, ClipboardCheck, type LucideIcon,
} from 'lucide-react';
import type { Activity } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/utils';

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  task_assigned: { icon: UserPlus, tone: 'bg-blue-500/10 text-blue-500' },
  task_accepted: { icon: ClipboardCheck, tone: 'bg-indigo-500/10 text-indigo-500' },
  project_created: { icon: FolderPlus, tone: 'bg-violet-500/10 text-violet-500' },
  project_assigned: { icon: Send, tone: 'bg-violet-500/10 text-violet-500' },
  progress_updated: { icon: TrendingUp, tone: 'bg-amber-500/10 text-amber-500' },
  task_submitted: { icon: Send, tone: 'bg-amber-500/10 text-amber-500' },
  manager_approved: { icon: CheckCircle2, tone: 'bg-teal-500/10 text-teal-500' },
  manager_rejected: { icon: XCircle, tone: 'bg-rose-500/10 text-rose-500' },
  admin_approved: { icon: CheckCircle2, tone: 'bg-emerald-500/10 text-emerald-500' },
  admin_rejected: { icon: XCircle, tone: 'bg-rose-500/10 text-rose-500' },
  comment_added: { icon: MessageSquare, tone: 'bg-sky-500/10 text-sky-500' },
  file_uploaded: { icon: Upload, tone: 'bg-cyan-500/10 text-cyan-500' },
};

export function ActivityFeed({ items, compact = false }: { items: Activity[]; compact?: boolean }) {
  return (
    <div className="relative">
      <div className="absolute bottom-2 left-[18px] top-2 w-px bg-border" />
      <div className="space-y-1">
        {items.map((a, i) => {
          const cfg = ICONS[a.action] ?? { icon: TrendingUp, tone: 'bg-muted text-muted-foreground' };
          const Icon = cfg.icon;
          return (
            <motion.div
              key={a._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="relative flex gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/50"
            >
              <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-surface ${cfg.tone}`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-foreground">{a.message}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {!compact && a.actor && (
                    <span className="flex items-center gap-1">
                      <Avatar name={a.actor.name} size="xs" className="h-4 w-4 text-[8px]" />
                      {a.actor.name}
                    </span>
                  )}
                  <span>{timeAgo(a.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
