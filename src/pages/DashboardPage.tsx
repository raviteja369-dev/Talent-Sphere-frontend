import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCog, FolderKanban, ListChecks, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, Hourglass, CalendarDays, Inbox, ClipboardCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard, useTasks, useActivity, useProjects } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatGridSkeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ChevronRight } from 'lucide-react';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { TaskCard } from '@/components/shared/TaskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartTooltip } from '@/components/shared/ChartTooltip';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const { data: activity } = useActivity({ limit: '8' });
  const { data: recentTasks } = useTasks();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const stats = data?.stats;

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0]}`}
        description={
          user?.role === 'admin'
            ? 'Organization-wide overview of projects, teams and delivery.'
            : user?.role === 'manager'
            ? 'Your projects, team performance and items awaiting review.'
            : 'Your tasks, deadlines and progress at a glance.'
        }
      />

      {isLoading || !stats ? (
        <StatGridSkeleton count={4} />
      ) : user?.role === 'admin' ? (
        <AdminDashboard stats={stats} departments={data.departmentProgress} />
      ) : user?.role === 'manager' ? (
        <ManagerStats stats={stats} />
      ) : (
        <EmployeeStats stats={stats} />
      )}

      {(user?.role === 'admin' || user?.role === 'manager') && <ProjectsOverview />}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={user?.role === 'employee' ? 'My Recent Tasks' : 'Recent Tasks'}
            action={<Link to="/tasks" className="text-sm font-medium text-primary hover:underline">View all</Link>}
          />
          <div className="p-4">
            {recentTasks?.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {recentTasks.slice(0, 4).map((t, i) => <TaskCard key={t._id} task={t} index={i} />)}
              </div>
            ) : (
              <EmptyState icon={Inbox} title="No tasks yet" description="Tasks assigned to you will appear here." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Activity Timeline" action={<Link to="/activity" className="text-sm font-medium text-primary hover:underline">View all</Link>} />
          <div className="p-4">
            {activity?.length ? (
              <ActivityFeed items={activity} compact />
            ) : (
              <EmptyState title="No recent activity" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProjectsOverview() {
  const { data: projects } = useProjects();
  if (!projects?.length) return null;
  return (
    <Card className="mt-6">
      <CardHeader
        title="Projects"
        subtitle="Click a project to open its full workspace"
        action={<Link to="/projects" className="text-sm font-medium text-primary hover:underline">View all</Link>}
      />
      <div className="divide-y divide-border">
        {projects.slice(0, 5).map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: p.color }}>
              {p.key || p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.department?.name || 'No department'} · {p.taskCount ?? 0} tasks</p>
            </div>
            <div className="hidden w-40 sm:block">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{p.progress}%</span>
              </div>
              <ProgressBar value={p.progress} />
            </div>
            <PriorityBadge priority={p.priority} className="hidden md:inline-flex" />
            {p.manager && <Avatar name={p.manager.name} size="xs" className="hidden lg:flex" />}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

const DEPT_CHART_COLORS = ['#2563EB', '#10B981', '#F97316', '#8B5CF6', '#6B7280', '#0EA5E9'];

function AdminDashboard({ stats, departments }: { stats: any; departments: any[] }) {
  const chartData = departments.map((d, i) => ({ name: d.name, progress: d.progress, color: DEPT_CHART_COLORS[i % DEPT_CHART_COLORS.length] }));
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Managers" value={stats.totalManagers} icon={UserCog} tone="blue" hint="Across all departments" delay={0} />
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} tone="purple" hint="Active workforce" delay={0.05} />
        <StatCard label="Total Projects" value={stats.totalProjects} icon={FolderKanban} tone="sky" hint="In flight org-wide" delay={0.1} />
        <StatCard label="Active Tasks" value={stats.activeTasks} icon={ListChecks} tone="orange" hint="Currently in progress" delay={0.15} />
        <StatCard label="Completed Tasks" value={stats.completedTasks} icon={CheckCircle2} tone="emerald" hint="Signed off & closed" delay={0.2} />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={Hourglass} tone="amber" hint="Awaiting review" delay={0.25} />
        <StatCard label="Delayed Tasks" value={stats.delayedTasks} icon={Clock} tone="gray" hint="Behind schedule" delay={0.3} />
        <StatCard label="Overdue Tasks" value={stats.overdueTasks} icon={AlertTriangle} tone="rose" hint="Past their due date" delay={0.35} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Overall Progress</p>
          <ProgressRing value={stats.overallProgress} size={140} stroke={12} />
          <p className="mt-4 text-center text-sm text-muted-foreground">Across all active workstreams</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Department-wise Progress" subtitle="Average completion by department" />
          <div className="p-4 pt-6">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                  <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No department data" />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function ManagerStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Assigned Projects" value={stats.assignedProjects} icon={FolderKanban} tone="blue" hint="You're managing" />
      <StatCard label="Assigned Tasks" value={stats.assignedTasks} icon={ListChecks} tone="sky" hint="Across your team" delay={0.05} />
      <StatCard label="Team Members" value={stats.teamMembers} icon={Users} tone="purple" hint="Direct reports" delay={0.1} />
      <StatCard label="Pending Reviews" value={stats.pendingReviews} icon={ClipboardCheck} tone="amber" hint="Awaiting your sign-off" delay={0.15} />
      <StatCard label="My Admin Tasks" value={stats.myAdminTasks} icon={Inbox} tone="orange" hint="Escalated to admin" delay={0.2} />
      <StatCard label="Completed Reviews" value={stats.completedReviews} icon={CheckCircle2} tone="emerald" hint="Approved this cycle" delay={0.25} />
      <StatCard label="Overdue (Team)" value={stats.overdueTasks} icon={AlertTriangle} tone="rose" hint="Need attention" delay={0.3} />
      <StatCard label="Team Progress" value={`${stats.teamProgress}%`} icon={TrendingUp} tone="emerald" hint="Average completion" delay={0.35} />
    </div>
  );
}

function EmployeeStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="My Tasks" value={stats.myTasks} icon={ListChecks} tone="blue" hint="Assigned to you" />
      <StatCard label="Today's Tasks" value={stats.todayTasks} icon={CalendarDays} tone="sky" hint="Due today" delay={0.05} />
      <StatCard label="Upcoming Deadlines" value={stats.upcoming} icon={Clock} tone="orange" hint="Next 7 days" delay={0.1} />
      <StatCard label="Pending Tasks" value={stats.pending} icon={Hourglass} tone="purple" hint="Not yet started" delay={0.15} />
      <StatCard label="Completed Tasks" value={stats.completed} icon={CheckCircle2} tone="emerald" hint="Done & approved" delay={0.2} />
      <StatCard label="Avg. Progress" value={`${stats.avgProgress}%`} icon={TrendingUp} tone="emerald" hint="Across active tasks" delay={0.25} />
    </div>
  );
}
