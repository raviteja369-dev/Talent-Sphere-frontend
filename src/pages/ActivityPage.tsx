import { useActivity } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Activity as ActivityIcon } from 'lucide-react';

export function ActivityPage() {
  const { data, isLoading } = useActivity({ limit: '100' });

  return (
    <div>
      <PageHeader title="Activity Log" description="A chronological audit trail of everything happening across the workspace." />
      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/4" /></div></div>)}</div>
        ) : data?.length ? (
          <ActivityFeed items={data} />
        ) : (
          <EmptyState icon={ActivityIcon} title="No activity yet" description="Actions across the workspace will be logged here." />
        )}
      </Card>
    </div>
  );
}
