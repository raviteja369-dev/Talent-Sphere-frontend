import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, FolderKanban, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useProjectMutations, useUsers, useDepartments } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FieldGroup } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/Progress';
import { PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { formatDate } from '@/lib/utils';
import { PRIORITIES } from '@/lib/constants';
import { apiError } from '@/lib/api';
import type { Department, Project, User } from '@/lib/types';

const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const fmtDate = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: projects, isLoading } = useProjects();
  const { data: managers } = useUsers({ role: 'manager' });
  const { data: departments } = useDepartments();
  const { create, update, remove } = useProjectMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const blank = { name: '', key: '', clientName: '', description: '', goals: '', timeline: '', budget: '', manager: '', department: '', priority: 'medium', status: 'active', startDate: '', dueDate: '' };
  const [form, setForm] = useState(blank);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name, key: p.key || '', clientName: p.clientName || '', description: p.description || '',
      goals: (p.goals || []).join('\n'), timeline: p.timeline || '', budget: p.budget ? String(p.budget) : '',
      manager: (p.manager as User)?._id || '', department: (p.department as Department)?._id || '',
      priority: p.priority, status: p.status || 'active', startDate: fmtDate(p.startDate), dueDate: fmtDate(p.dueDate),
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Project name is required');
    const body = {
      ...form,
      manager: form.manager || undefined,
      department: form.department || undefined,
      budget: Number(form.budget) || 0,
      goals: form.goals ? form.goals.split('\n').map((g) => g.trim()).filter(Boolean) : [],
    } as any;
    try {
      if (editing) { await update.mutateAsync({ id: editing._id, body }); toast.success('Project updated'); }
      else { await create.mutateAsync(body); toast.success('Project created'); }
      setOpen(false);
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Strategic initiatives and their delivery progress."
        action={isAdmin && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Project</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : !projects?.length ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description={isAdmin ? 'Create your first project to get started.' : 'No projects have been assigned to you.'}
          action={isAdmin && <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Project</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="card group p-5 transition-shadow hover:shadow-elevated">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl font-bold text-white" style={{ background: p.color }}>
                    {p.key || p.name[0]}
                  </div>
                  <div>
                    <Link to={`/projects/${p._id}`} className="font-semibold text-foreground hover:text-primary">{p.name}</Link>
                    <p className="text-xs text-muted-foreground">{p.department?.name || 'No department'}</p>
                  </div>
                </div>
                {isAdmin && (
                  <Dropdown trigger={<span className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></span>}>
                    {(close) => (
                      <>
                        <DropdownItem onClick={() => { close(); openEdit(p); }}><Pencil className="h-4 w-4" /> Edit</DropdownItem>
                        <DropdownItem danger onClick={async () => { close(); if (confirm('Delete this project and its tasks?')) { await remove.mutateAsync(p._id); toast.success('Project deleted'); } }}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownItem>
                      </>
                    )}
                  </Dropdown>
                )}
              </div>
              {p.description && <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  {p.manager && <Avatar name={p.manager.name} size="xs" />}
                  <span className="text-xs text-muted-foreground">{p.manager?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={p.priority} />
                  <span className="text-xs text-muted-foreground">{p.taskCount ?? 0} tasks</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Due {formatDate(p.dueDate)}</p>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg"
        title={editing ? 'Edit Project' : 'Create New Project'}
        description={editing ? 'Update project details and assignment.' : 'Set up a new initiative and assign a manager.'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={create.isPending || update.isPending}>{editing ? 'Save Changes' : 'Create Project'}</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><FieldGroup label="Project name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Atlas Cloud Migration" required /></FieldGroup></div>
            <FieldGroup label="Key" hint="Used for task codes"><Input value={form.key} onChange={(e) => set('key', e.target.value.toUpperCase())} placeholder="ATL" maxLength={5} /></FieldGroup>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2"><FieldGroup label="Client name"><Input value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Acme Corp" /></FieldGroup></div>
            <FieldGroup label="Budget (USD)"><Input type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="50000" /></FieldGroup>
          </div>
          <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this project about?" /></FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Goals" hint="One per line"><Textarea value={form.goals} onChange={(e) => set('goals', e.target.value)} placeholder={'Migrate to cloud\nReduce costs 30%'} className="min-h-[80px]" /></FieldGroup>
            <FieldGroup label="Timeline"><Textarea value={form.timeline} onChange={(e) => set('timeline', e.target.value)} placeholder="e.g. Q1–Q2, 3 phases over 6 months" className="min-h-[80px]" /></FieldGroup>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Assign manager">
              <Select value={form.manager} onChange={(e) => set('manager', e.target.value)}>
                <option value="">Select manager…</option>
                {managers?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="Department">
              <Select value={form.department} onChange={(e) => set('department', e.target.value)}>
                <option value="">Select department…</option>
                {departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <FieldGroup label="Priority">
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
              </Select>
            </FieldGroup>
            {editing && (
              <FieldGroup label="Status">
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                </Select>
              </FieldGroup>
            )}
            <FieldGroup label="Start date"><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></FieldGroup>
            <FieldGroup label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></FieldGroup>
          </div>
        </form>
      </Modal>
    </div>
  );
}
