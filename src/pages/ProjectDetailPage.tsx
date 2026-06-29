import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  ArrowLeft, LayoutGrid, ListChecks, Users, CalendarDays, GitBranch, Paperclip,
  BarChart3, Activity as ActivityIcon, Settings as SettingsIcon, Plus, ChevronLeft,
  ChevronRight, FileText, Download, RefreshCw, Trash2, Target, CheckCircle2, Clock,
  AlertTriangle, Building2, Wallet, CalendarRange, Flag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useActivity, useProjectMutations, useUsers, useDepartments } from '@/hooks/queries';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FieldGroup } from '@/components/ui/Field';
import { Card, CardHeader } from '@/components/ui/Card';
import { PriorityBadge, StatusBadge, Badge } from '@/components/ui/Badge';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskFormModal } from '@/components/shared/TaskFormModal';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { ChartTooltip } from '@/components/shared/ChartTooltip';
import { STATUS_CONFIG, PRIORITIES } from '@/lib/constants';
import { cn, formatDate, nFormat } from '@/lib/utils';
import { apiError, assetUrl } from '@/lib/api';
import type { Task, User, Department } from '@/lib/types';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'timeline', label: 'Timeline', icon: GitBranch },
  { id: 'files', label: 'Files', icon: Paperclip },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

const CHART_COLORS = ['#2563EB', '#10B981', '#F97316', '#8B5CF6', '#6B7280', '#0EA5E9', '#DC2626'];
const PROJECT_STATUS = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const statusPill: Record<string, string> = {
  planning: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  on_hold: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  completed: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};
const titleCase = (s?: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = isAdmin || user?.role === 'manager';

  const { data: project, isLoading } = useProject(id);
  const { data: activity } = useActivity({ project: id, limit: '50' });
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const setTab = (t: string) => setParams((p) => { p.set('tab', t); return p; }, { replace: true });
  const [taskModal, setTaskModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (!project) return <EmptyState title="Project not found" description="This project may have been removed or you don't have access." />;

  const tasks = project.tasks ?? [];
  const team = project.team ?? [];
  const stats = project.stats ?? { total: 0, completed: 0, inReview: 0, overdue: 0, progress: project.progress };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <Card className="mb-5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm" style={{ background: project.color }}>
              {project.key || project.name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', statusPill[project.status] || statusPill.active)}>{titleCase(project.status)}</span>
                <PriorityBadge priority={project.priority} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {project.clientName && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{project.clientName}</span>}
                {project.department?.name && <span>{project.department.name}</span>}
                {project.manager && <span className="inline-flex items-center gap-1"><Avatar name={project.manager.name} size="xs" />{project.manager.name}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-foreground">{stats.progress}%</p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
            <ProgressRing value={stats.progress} size={56} stroke={6} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat icon={ListChecks} tone="text-blue-600 dark:text-blue-400" label="Total tasks" value={stats.total} />
          <MiniStat icon={CheckCircle2} tone="text-emerald-600 dark:text-emerald-400" label="Completed" value={stats.completed} />
          <MiniStat icon={Clock} tone="text-amber-600 dark:text-amber-400" label="In review" value={stats.inReview} />
          <MiniStat icon={AlertTriangle} tone="text-red-600 dark:text-red-400" label="Overdue" value={stats.overdue} />
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {active && <motion.span layoutId="proj-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'overview' && <OverviewTab project={project} stats={stats} />}
        {tab === 'tasks' && <TasksTab tasks={tasks} canCreate={isManagerOrAdmin} onNew={() => setTaskModal(true)} />}
        {tab === 'team' && <TeamTab team={team} tasks={tasks} />}
        {tab === 'calendar' && <CalendarTab tasks={tasks} />}
        {tab === 'timeline' && <TimelineTab project={project} tasks={tasks} />}
        {tab === 'files' && <FilesTab tasks={tasks} />}
        {tab === 'reports' && <ReportsTab tasks={tasks} stats={stats} />}
        {tab === 'activity' && (
          <Card>
            <CardHeader title="Project Activity" subtitle="Everything that has happened on this project" />
            <div className="p-5">{activity?.length ? <ActivityFeed items={activity} /> : <EmptyState title="No activity yet" />}</div>
          </Card>
        )}
        {tab === 'settings' && <SettingsTab project={project} isAdmin={isAdmin} canRecalc={isManagerOrAdmin} />}
      </motion.div>

      <TaskFormModal open={taskModal} onClose={() => setTaskModal(false)} defaultProject={project._id} />
    </div>
  );
}

function MiniStat({ icon: Icon, tone, label, value }: { icon: any; tone: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
      <Icon className={cn('h-5 w-5 shrink-0', tone)} />
      <div>
        <p className="font-display text-lg font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────── */
function OverviewTab({ project, stats }: { project: any; stats: any }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader title="About this project" />
          <div className="p-5">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{project.description || 'No description provided.'}</p>
            {!!project.goals?.length && (
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Target className="h-4 w-4" /> Goals</p>
                <ul className="space-y-1.5">
                  {project.goals.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.timeline && (
              <div className="mt-5">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground"><CalendarRange className="h-4 w-4" /> Timeline</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.timeline}</p>
              </div>
            )}
          </div>
        </Card>

        {!!project.milestones?.length && (
          <Card>
            <CardHeader title="Milestones" subtitle={`${project.milestones.filter((m: any) => m.done).length} of ${project.milestones.length} reached`} />
            <div className="divide-y divide-border">
              {project.milestones.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', m.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border')}>
                    {m.done && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{m.title}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Details" />
          <div className="space-y-3 p-5 text-sm">
            <DetailRow icon={Building2} label="Client" value={project.clientName || '—'} />
            <DetailRow icon={Wallet} label="Budget" value={project.budget ? `$${nFormat(project.budget)}` : '—'} />
            <DetailRow icon={Flag} label="Priority" value={titleCase(project.priority)} />
            <DetailRow icon={Building2} label="Department" value={project.department?.name || '—'} />
            <DetailRow icon={CalendarDays} label="Start" value={formatDate(project.startDate)} />
            <DetailRow icon={CalendarDays} label="Due" value={formatDate(project.dueDate)} />
          </div>
        </Card>
        <Card className="flex flex-col items-center p-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Overall progress</p>
          <ProgressRing value={stats.progress} size={120} stroke={10} />
          <p className="mt-3 text-center text-xs text-muted-foreground">{stats.completed} of {stats.total} tasks completed</p>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" />{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ── Tasks ─────────────────────────────────────────────── */
function TasksTab({ tasks, canCreate, onNew }: { tasks: Task[]; canCreate: boolean; onNew: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Tasks"
        subtitle={`${tasks.length} task${tasks.length === 1 ? '' : 's'} in this project`}
        action={canCreate ? <Button size="sm" onClick={onNew}><Plus className="h-4 w-4" /> New Task</Button> : undefined}
      />
      <div className="p-5">
        {tasks.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tasks.map((t, i) => <TaskCard key={t._id} task={t} index={i} />)}
          </div>
        ) : (
          <EmptyState icon={ListChecks} title="No tasks yet" description={canCreate ? 'Create the first task to get work moving.' : 'No tasks have been created yet.'}
            action={canCreate ? <Button size="sm" onClick={onNew}><Plus className="h-4 w-4" /> New Task</Button> : undefined} />
        )}
      </div>
    </Card>
  );
}

/* ── Team ─────────────────────────────────────────────── */
function TeamTab({ team, tasks }: { team: User[]; tasks: Task[] }) {
  const counts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    tasks.forEach((t) => {
      const uid = t.assignedTo?._id;
      if (!uid) return;
      map[uid] = map[uid] || { total: 0, done: 0 };
      map[uid].total += 1;
      if (t.status === 'completed') map[uid].done += 1;
    });
    return map;
  }, [tasks]);

  if (!team.length) return <Card><div className="p-5"><EmptyState icon={Users} title="No team members yet" description="People assigned to this project's tasks will appear here." /></div></Card>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((u) => {
        const c = counts[u._id] || { total: 0, done: 0 };
        return (
          <Card key={u._id} className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.jobTitle || titleCase(u.role)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.done}/{c.total} tasks done</span>
                <span className="font-semibold text-foreground">{c.total ? Math.round((c.done / c.total) * 100) : 0}%</span>
              </div>
              <ProgressBar value={c.total ? Math.round((c.done / c.total) * 100) : 0} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Calendar ─────────────────────────────────────────────── */
function CalendarTab({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        (map[day] = map[day] || []).push(t);
      }
    });
    return map;
  }, [tasks, year, month]);

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <Card>
      <CardHeader
        title={cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
        subtitle="Tasks shown on their due date"
        action={
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">Today</button>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
        }
      />
      <div className="p-4">
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => (
            <div key={i} className={cn('min-h-[84px] rounded-lg border p-1.5', day ? 'border-border bg-surface' : 'border-transparent')}>
              {day && (
                <>
                  <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium', isToday(day) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {(byDay[day] || []).slice(0, 3).map((t) => (
                      <Link key={t._id} to={`/tasks/${t._id}`} className="block truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-accent" style={{ background: 'hsl(var(--primary-light))' }} title={t.title}>
                        {t.title}
                      </Link>
                    ))}
                    {(byDay[day] || []).length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{(byDay[day] || []).length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ── Timeline ─────────────────────────────────────────────── */
function TimelineTab({ project, tasks }: { project: any; tasks: Task[] }) {
  const items = useMemo(() => {
    const list: { date?: string; title: string; sub: string; kind: 'milestone' | 'task'; status?: string; id?: string }[] = [];
    (project.milestones || []).forEach((m: any) => list.push({ date: m.date, title: m.title, sub: m.done ? 'Milestone · reached' : 'Milestone', kind: 'milestone' }));
    tasks.forEach((t) => list.push({ date: t.dueDate || t.startDate || t.createdAt, title: t.title, sub: `Task · due ${formatDate(t.dueDate)}`, kind: 'task', status: t.status, id: t._id }));
    return list.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  }, [project.milestones, tasks]);

  if (!items.length) return <Card><div className="p-5"><EmptyState icon={GitBranch} title="Nothing scheduled yet" /></div></Card>;

  return (
    <Card>
      <CardHeader title="Timeline" subtitle="Milestones and tasks in chronological order" />
      <div className="p-5">
        <div className="relative ml-3 space-y-5 border-l-2 border-border pl-6">
          {items.map((it, i) => (
            <div key={i} className="relative">
              <span className={cn('absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface', it.kind === 'milestone' ? 'bg-purple-500' : 'bg-primary')} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  {it.id ? (
                    <Link to={`/tasks/${it.id}`} className="font-medium text-foreground hover:text-primary">{it.title}</Link>
                  ) : (
                    <p className="font-medium text-foreground">{it.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{it.sub}</p>
                </div>
                {it.status && <StatusBadge status={it.status as any} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ── Files ─────────────────────────────────────────────── */
function FilesTab({ tasks }: { tasks: Task[] }) {
  const files = useMemo(() => {
    const all: { name: string; url: string; uploadedBy?: string; createdAt?: string; task: string; taskId: string }[] = [];
    tasks.forEach((t) => (t.attachments || []).forEach((a) => all.push({ name: a.name, url: a.url, uploadedBy: a.uploadedBy?.name, createdAt: a.createdAt, task: t.title, taskId: t._id })));
    return all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [tasks]);

  return (
    <Card>
      <CardHeader title="Files" subtitle={`${files.length} deliverable${files.length === 1 ? '' : 's'} across all tasks`} />
      <div className="p-5">
        {files.length ? (
          <div className="space-y-2">
            {files.map((f, i) => (
              <a key={i} href={assetUrl(f.url)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.task}{f.uploadedBy ? ` · ${f.uploadedBy}` : ''}</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        ) : (
          <EmptyState icon={Paperclip} title="No files yet" description="Deliverables uploaded to this project's tasks will appear here." />
        )}
      </div>
    </Card>
  );
}

/* ── Reports ─────────────────────────────────────────────── */
function ReportsTab({ tasks, stats }: { tasks: Task[]; stats: any }) {
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => { const label = STATUS_CONFIG[t.status]?.label || t.status; map[label] = (map[label] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const priorityData = useMemo(() => {
    const order = ['low', 'medium', 'high', 'critical'];
    const map: Record<string, number> = {};
    tasks.forEach((t) => { map[t.priority] = (map[t.priority] || 0) + 1; });
    return order.map((p) => ({ name: p[0].toUpperCase() + p.slice(1), value: map[p] || 0 }));
  }, [tasks]);

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (!tasks.length) return <Card><div className="p-5"><EmptyState icon={BarChart3} title="No data to report yet" description="Reports populate once tasks exist." /></div></Card>;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Tasks by status" />
        <div className="p-5">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {statusData.map((d, i) => (
              <span key={d.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Tasks by priority" />
        <div className="p-5 pt-6">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2563EB" maxBarSize={56} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Delivery summary" />
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <MiniStat icon={CheckCircle2} tone="text-emerald-600 dark:text-emerald-400" label="Completion rate" value={completionRate} />
          <MiniStat icon={ListChecks} tone="text-blue-600 dark:text-blue-400" label="Total tasks" value={stats.total} />
          <MiniStat icon={Clock} tone="text-amber-600 dark:text-amber-400" label="In review" value={stats.inReview} />
          <MiniStat icon={AlertTriangle} tone="text-red-600 dark:text-red-400" label="Overdue" value={stats.overdue} />
        </div>
      </Card>
    </div>
  );
}

/* ── Settings ─────────────────────────────────────────────── */
function SettingsTab({ project, isAdmin, canRecalc }: { project: any; isAdmin: boolean; canRecalc: boolean }) {
  const navigate = useNavigate();
  const { update, remove, recalc } = useProjectMutations();
  const { data: managers } = useUsers(isAdmin ? { role: 'manager' } : {});
  const { data: departments } = useDepartments();

  const fmt = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const [form, setForm] = useState({
    name: project.name, clientName: project.clientName || '', description: project.description || '',
    status: project.status || 'active', priority: project.priority || 'medium', budget: project.budget ? String(project.budget) : '',
    manager: (project.manager as User)?._id || '', department: (project.department as Department)?._id || '',
    startDate: fmt(project.startDate), dueDate: fmt(project.dueDate),
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await update.mutateAsync({ id: project._id, body: { ...form, budget: Number(form.budget) || 0, manager: form.manager || undefined, department: form.department || undefined } as any });
      toast.success('Project updated');
    } catch (e) { toast.error(apiError(e)); }
  };

  const doRecalc = async () => {
    try { await recalc.mutateAsync(project._id); toast.success('Progress recalculated'); }
    catch (e) { toast.error(apiError(e)); }
  };

  const doDelete = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try { await remove.mutateAsync(project._id); toast.success('Project deleted'); navigate('/projects'); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Project settings" subtitle={isAdmin ? 'Update project details and assignment' : 'Only admins can edit project details'} />
        <div className="space-y-4 p-5">
          <fieldset disabled={!isAdmin} className="space-y-4 disabled:opacity-70">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldGroup label="Project name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></FieldGroup>
              <FieldGroup label="Client"><Input value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /></FieldGroup>
            </div>
            <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} /></FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FieldGroup label="Status">
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {PROJECT_STATUS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </Select>
              </FieldGroup>
              <FieldGroup label="Priority">
                <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                </Select>
              </FieldGroup>
              <FieldGroup label="Budget (USD)"><Input type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} /></FieldGroup>
            </div>
            {isAdmin && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup label="Manager">
                  <Select value={form.manager} onChange={(e) => set('manager', e.target.value)}>
                    <option value="">Unassigned</option>
                    {managers?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </Select>
                </FieldGroup>
                <FieldGroup label="Department">
                  <Select value={form.department} onChange={(e) => set('department', e.target.value)}>
                    <option value="">None</option>
                    {departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </Select>
                </FieldGroup>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldGroup label="Start date"><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></FieldGroup>
              <FieldGroup label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></FieldGroup>
            </div>
          </fieldset>
          {isAdmin && <div className="flex justify-end border-t border-border pt-4"><Button onClick={save} loading={update.isPending}>Save Changes</Button></div>}
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Maintenance" />
          <div className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">Recalculate progress and completion from the project's current tasks.</p>
            <Button variant="outline" onClick={doRecalc} loading={recalc.isPending} disabled={!canRecalc}><RefreshCw className="h-4 w-4" /> Recalculate progress</Button>
          </div>
        </Card>
        {isAdmin && (
          <Card className="border-red-200 dark:border-red-500/30">
            <CardHeader title={<span className="text-red-600 dark:text-red-400">Danger zone</span>} />
            <div className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">Deleting a project permanently removes it and all of its tasks.</p>
              <Button variant="danger" onClick={doDelete} loading={remove.isPending}><Trash2 className="h-4 w-4" /> Delete project</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
