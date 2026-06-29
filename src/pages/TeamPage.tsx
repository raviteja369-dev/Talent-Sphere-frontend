import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Plus, Users, TrendingUp, CheckCircle2, AlertTriangle, MoreVertical, Trash2, ListChecks } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamPerformance, useUserMutations, useDepartments } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select, FieldGroup } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiError } from '@/lib/api';

export function TeamPage() {
  const { user } = useAuth();
  const { data: perf, isLoading } = useTeamPerformance();
  const { data: departments } = useDepartments();
  const { create, remove } = useUserMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', jobTitle: '', department: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Name, email and password are required');
    try {
      await create.mutateAsync({ ...form, role: 'employee', department: form.department || undefined } as any);
      toast.success('Team member added');
      setForm({ name: '', email: '', password: '', jobTitle: '', department: '' });
      setOpen(false);
    } catch (err) { toast.error(apiError(err)); }
  };

  const team = perf || [];
  const avgRate = team.length ? Math.round(team.reduce((s: number, p: any) => s + p.completionRate, 0) / team.length) : 0;

  return (
    <div>
      <PageHeader title="My Team" description="Your team members and their performance."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Member</Button>} />

      {!isLoading && team.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10"><Users className="h-6 w-6 text-indigo-500" /></div>
            <div><p className="text-sm text-muted-foreground">Team Size</p><p className="font-display text-2xl font-bold">{team.length}</p></div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <ProgressRing value={avgRate} size={52} stroke={5} />
            <div><p className="text-sm text-muted-foreground">Avg. Completion</p><p className="font-display text-2xl font-bold">{avgRate}%</p></div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
            <div><p className="text-sm text-muted-foreground">Tasks Completed</p><p className="font-display text-2xl font-bold">{team.reduce((s: number, p: any) => s + p.completed, 0)}</p></div>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : !team.length ? (
        <EmptyState icon={Users} title="No team members yet" description="Add employees to start delegating work." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Member</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((p: any, i: number) => (
            <motion.div key={p.employee._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={p.employee.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{p.employee.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.employee.jobTitle || 'Team member'}</p>
                </div>
                <Dropdown trigger={<span className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></span>}>
                  {(close) => (
                    <>
                      <Link to={`/tasks?assignedTo=${p.employee._id}`} onClick={close}>
                        <DropdownItem><ListChecks className="h-4 w-4" /> View Tasks</DropdownItem>
                      </Link>
                      <DropdownItem danger onClick={async () => { close(); if (confirm(`Remove ${p.employee.name} from your team?`)) { await remove.mutateAsync(p.employee._id); toast.success('Member removed'); } }}>
                        <Trash2 className="h-4 w-4" /> Remove
                      </DropdownItem>
                    </>
                  )}
                </Dropdown>
              </div>
              <div className="my-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion rate</span>
                  <span className="font-semibold text-foreground">{p.completionRate}%</span>
                </div>
                <ProgressBar value={p.completionRate} />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <Stat icon={<TrendingUp className="h-3.5 w-3.5 text-sky-500" />} value={p.total} label="Total" />
                <Stat icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} value={p.completed} label="Done" />
                <Stat icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-500" />} value={p.overdue} label="Overdue" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member" description="New employees will automatically report to you."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={create.isPending}>Add Member</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Full name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" required /></FieldGroup>
            <FieldGroup label="Job title"><Input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Frontend Developer" /></FieldGroup>
          </div>
          <FieldGroup label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" required /></FieldGroup>
          <FieldGroup label="Temporary password"><Input type="text" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 6 characters" required /></FieldGroup>
          <FieldGroup label="Department">
            <Select value={form.department} onChange={(e) => set('department', e.target.value)}>
              <option value="">Select…</option>
              {departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Select>
          </FieldGroup>
        </form>
      </Modal>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1">{icon}<span className="font-semibold text-foreground">{value}</span></div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
