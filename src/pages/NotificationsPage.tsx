import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications, useNotificationMutations } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, timeAgo } from '@/lib/utils';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const { markRead, markAllRead, remove } = useNotificationMutations();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay on top of assignments, approvals and updates."
        action={!!data?.unread && <Button variant="outline" onClick={() => markAllRead.mutate()}><CheckCheck className="h-4 w-4" /> Mark all read</Button>}
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !data?.notifications.length ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
      ) : (
        <div className="space-y-2.5">
          {data.notifications.map((n, i) => (
            <motion.div key={n._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
              <Card className={cn('flex items-start gap-3 p-4 transition-colors', !n.read && 'border-l-4 border-l-primary')}>
                <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                  <Bell className="h-[18px] w-[18px]" />
                </div>
                <button onClick={() => { markRead.mutate(n._id); if (n.task) navigate(`/tasks/${n.task._id}`); }} className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                </button>
                <div className="flex items-center gap-1">
                  {!n.read && <button onClick={() => markRead.mutate(n._id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Mark read"><Check className="h-4 w-4" /></button>}
                  <button onClick={() => remove.mutate(n._id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
