import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { FileDown, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { useAnalytics } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartTooltip } from '@/components/shared/ChartTooltip';
import { STATUS_CONFIG } from '@/lib/constants';
import type { TaskStatus } from '@/lib/types';
import { toast } from 'sonner';

// Muted enterprise palette: navy, blue, emerald, amber, slate (+ supporting tones)
const PIE_COLORS = ['#2563EB', '#10B981', '#F97316', '#8B5CF6', '#6B7280', '#0EA5E9', '#16A34A', '#F59E0B', '#7C3AED', '#9CA3AF', '#DC2626'];
const C = { navy: '#1D4ED8', blue: '#2563EB', emerald: '#10B981', amber: '#F97316', slate: '#8B5CF6' };

export function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  const exportCSV = () => {
    if (!data) return;
    const rows = [['Employee', 'Total Tasks', 'Completed', 'Completion Rate (%)']];
    data.employeeProductivity.forEach((e: any) => rows.push([e.name, e.total, e.completed, e.rate]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'talent-sphere-analytics.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" description="Insights into productivity and delivery performance." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!data) return <EmptyState icon={BarChart3} title="No analytics available" />;

  const statusData = data.statusDistribution.map((s: any) => ({
    name: STATUS_CONFIG[s.status as TaskStatus]?.label || s.status,
    value: s.count,
  }));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Insights into productivity, performance and delivery."
        action={
          <>
            <Button variant="outline" onClick={exportCSV}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
            <Button variant="outline" onClick={() => window.print()}><FileDown className="h-4 w-4" /> PDF</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Weekly Progress" subtitle="Tasks created vs completed (last 7 days)" />
          <div className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.weekly} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.25} /><stop offset="100%" stopColor={C.blue} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.emerald} stopOpacity={0.25} /><stop offset="100%" stopColor={C.emerald} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="created" stroke={C.blue} strokeWidth={2} fill="url(#gC)" name="Created" />
                <Area type="monotone" dataKey="completed" stroke={C.emerald} strokeWidth={2} fill="url(#gD)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Monthly Progress" subtitle="Delivery trend (last 6 months)" />
          <div className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthly} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="completed" stroke={C.emerald} strokeWidth={2.5} dot={{ r: 3 }} name="Completed" />
                <Line type="monotone" dataKey="created" stroke={C.navy} strokeWidth={2.5} dot={{ r: 3 }} name="Created" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Employee Productivity" subtitle="Top performers by completed tasks" />
          <div className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.employeeProductivity} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                <Bar dataKey="completed" radius={[0, 6, 6, 0]} fill={C.navy} maxBarSize={22} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Task Status Distribution" subtitle="Breakdown across all statuses" />
          <div className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {statusData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Manager Performance" subtitle="Team completion rate by manager" />
          <div className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.managerPerformance} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]} fill={C.blue} maxBarSize={48} name="Completion rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Workload Distribution" subtitle="Active tasks per employee" />
          <div className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.workload} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                <Bar dataKey="active" radius={[6, 6, 0, 0]} fill={C.amber} maxBarSize={36} name="Active tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
