import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, LayoutGrid, Rows3, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useProjects } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskFormModal } from '@/components/shared/TaskFormModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SortHeader, Pagination } from '@/components/ui/Table';
import { useTable } from '@/hooks/useTable';
import { STATUS_FILTERS, PRIORITIES } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { Task, TaskStatus } from '@/lib/types';

const PRIORITY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
const taskValue = (t: Task, key: string): string | number => {
  switch (key) {
    case 'title': return t.title?.toLowerCase() || '';
    case 'assignee': return t.assignedTo?.name?.toLowerCase() || '';
    case 'priority': return PRIORITY_ORDER[t.priority] ?? 0;
    case 'status': return t.status || '';
    case 'progress': return t.progress ?? 0;
    case 'due': return t.dueDate ? new Date(t.dueDate).getTime() : 0;
    default: return '';
  }
};

export function TasksPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filters = {
    search: params.get('search') || undefined,
    status: params.get('status') || undefined,
    priority: params.get('priority') || undefined,
    project: params.get('project') || undefined,
    assignedTo: params.get('assignedTo') || undefined,
  };
  const setFilter = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const { data: tasks, isLoading } = useTasks(filters);
  const { data: projects } = useProjects();
  const canCreate = user?.role === 'admin' || user?.role === 'manager';
  const table = useTable<Task>(tasks ?? [], taskValue, 10);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Track, filter and manage work across your organization."
        action={canCreate && (
          <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Assign Task</Button>
        )}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.search || ''}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search tasks by title…"
            className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm focus-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)} className="w-auto min-w-[140px]">
            <option value="">All statuses</option>
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select value={filters.priority || ''} onChange={(e) => setFilter('priority', e.target.value)} className="w-auto min-w-[120px]">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p[0].toUpperCase() + p.slice(1)}</option>)}
          </Select>
          <Select value={filters.project || ''} onChange={(e) => setFilter('project', e.target.value)} className="w-auto min-w-[140px]">
            <option value="">All projects</option>
            {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <button onClick={() => setView('grid')} className={cn('rounded-md p-1.5', view === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground')}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={cn('rounded-md p-1.5', view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground')}><Rows3 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !tasks?.length ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={Object.values(filters).some(Boolean) ? 'Try adjusting your filters or search.' : 'There are no tasks here yet.'}
          action={canCreate && <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Assign Task</Button>}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t, i) => <TaskCard key={t._id} task={t} index={i} />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-16 z-10 border-b border-border bg-muted/95 text-left backdrop-blur">
                <SortHeader label="Task" columnKey="title" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
                <SortHeader label="Assignee" columnKey="assignee" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
                <SortHeader label="Priority" columnKey="priority" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
                <SortHeader label="Status" columnKey="status" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
                <SortHeader label="Progress" columnKey="progress" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
                <SortHeader label="Due" columnKey="due" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((t) => (
                <tr key={t._id} className="border-b border-border transition-colors odd:bg-surface even:bg-muted/30 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${t._id}`} className="font-medium text-foreground hover:text-primary">{t.title}</Link>
                    {t.project && <p className="text-xs text-muted-foreground">{t.project.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {t.assignedTo ? (
                      <span className="flex items-center gap-2"><Avatar name={t.assignedTo.name} size="xs" /><span className="text-foreground">{t.assignedTo.name}</span></span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status as TaskStatus} /></td>
                  <td className="px-4 py-3"><span className="font-semibold text-foreground">{t.progress}%</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(t.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination page={table.page} totalPages={table.totalPages} total={table.total} pageSize={10} onPage={table.setPage} />
        </div>
      )}

      <TaskFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
