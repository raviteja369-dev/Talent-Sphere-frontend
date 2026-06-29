import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Building2, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { useDepartments, useDepartmentMutations, useUsers } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FieldGroup, Label } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { apiError } from '@/lib/api';
import type { Department, User } from '@/lib/types';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#3b82f6'];

export function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: managers } = useUsers({ role: 'manager' });
  const { create, update, remove } = useDepartmentMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const blank = { name: '', description: '', color: COLORS[0], head: '' };
  const [form, setForm] = useState(blank);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description || '', color: d.color || COLORS[0], head: (d.head as User)?._id || '' });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Department name is required');
    const body = { ...form, head: form.head || undefined } as any;
    try {
      if (editing) { await update.mutateAsync({ id: editing._id, body }); toast.success('Department updated'); }
      else { await create.mutateAsync(body); toast.success('Department created'); }
      setOpen(false);
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <div>
      <PageHeader title="Departments" description="Organize your company into departments and teams."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Department</Button>} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : !departments?.length ? (
        <EmptyState icon={Building2} title="No departments yet" description="Create departments to structure your organization." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New Department</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d, i) => (
            <motion.div key={d._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="card relative overflow-hidden p-5">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: d.color }} />
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: d.color }}>
                  <Building2 className="h-6 w-6" />
                </div>
                <Dropdown trigger={<span className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></span>}>
                  {(close) => (
                    <>
                      <DropdownItem onClick={() => { close(); openEdit(d); }}><Pencil className="h-4 w-4" /> Edit</DropdownItem>
                      <DropdownItem danger onClick={async () => { close(); if (confirm(`Delete ${d.name}?`)) { await remove.mutateAsync(d._id); toast.success('Department deleted'); } }}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownItem>
                    </>
                  )}
                </Dropdown>
              </div>
              <h3 className="mt-3 font-display font-semibold text-foreground">{d.name}</h3>
              {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                {d.head ? (
                  <><Avatar name={d.head.name} size="xs" /><span className="text-xs text-muted-foreground">Led by <span className="font-medium text-foreground">{d.head.name}</span></span></>
                ) : (
                  <span className="text-xs text-muted-foreground">No department head assigned</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit Department' : 'Create Department'}
        description={editing ? 'Update this department\'s details.' : 'Add a new department to your organization.'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={create.isPending || update.isPending}>{editing ? 'Save Changes' : 'Create'}</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FieldGroup label="Department name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Engineering" required /></FieldGroup>
          <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What does this department do?" /></FieldGroup>
          <FieldGroup label="Department head">
            <Select value={form.head} onChange={(e) => set('head', e.target.value)}>
              <option value="">Select manager…</option>
              {managers?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </Select>
          </FieldGroup>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`h-8 w-8 rounded-lg transition-transform ${form.color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined }} />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
