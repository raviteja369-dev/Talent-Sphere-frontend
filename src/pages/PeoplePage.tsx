import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Mail, MoreVertical, UserCog, Users, Pencil, Power } from 'lucide-react';
import { useUsers, useUserMutations, useDepartments } from '@/hooks/queries';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select, FieldGroup } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { SortHeader, Pagination } from '@/components/ui/Table';
import { useTable } from '@/hooks/useTable';
import { cn } from '@/lib/utils';
import { apiError } from '@/lib/api';
import type { Department, User } from '@/lib/types';

const userValue = (u: User, key: string): string | number => {
  switch (key) {
    case 'name': return u.name?.toLowerCase() || '';
    case 'jobTitle': return u.jobTitle?.toLowerCase() || '';
    case 'department': return (u.department as Department)?.name?.toLowerCase() || '';
    case 'manager': return (u.manager as User)?.name?.toLowerCase() || '';
    case 'status': return u.isActive === false ? 1 : 0;
    default: return '';
  }
};

export function PeoplePage() {
  const [tab, setTab] = useState<'manager' | 'employee'>('manager');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const { data: users, isLoading } = useUsers({ role: tab, search: search || undefined });
  const { data: managers } = useUsers({ role: 'manager' });
  const { data: departments } = useDepartments();
  const { create, update, remove } = useUserMutations();
  const table = useTable<User>(users ?? [], userValue, 8);

  const blank = { name: '', email: '', password: '', role: tab, department: '', manager: '', jobTitle: '' };
  const [form, setForm] = useState(blank);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm({ ...blank, role: tab }); setOpen(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name, email: u.email, password: '', role: (u.role === 'admin' ? 'manager' : u.role) as 'manager' | 'employee',
      department: (u.department as Department)?._id || (u.department as string) || '',
      manager: (u.manager as User)?._id || (u.manager as string) || '',
      jobTitle: u.jobTitle || '',
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editing && !form.password) return toast.error('Password is required for new accounts');
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing._id,
          body: { name: form.name, email: form.email, jobTitle: form.jobTitle, department: form.department || undefined, manager: form.manager || undefined } as any,
        });
        toast.success('Changes saved');
      } else {
        await create.mutateAsync({ ...form, department: form.department || undefined, manager: form.manager || undefined } as any);
        toast.success(`${tab === 'manager' ? 'Manager' : 'Employee'} created`);
      }
      setOpen(false);
    } catch (err) { toast.error(apiError(err)); }
  };

  const toggleActive = async (u: User) => {
    try {
      await update.mutateAsync({ id: u._id, body: { isActive: !u.isActive } as any });
      toast.success(u.isActive ? 'Account deactivated' : 'Account activated');
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <div>
      <PageHeader title="Managers & Staff" description="Manage your organization's people and reporting structure."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add {tab === 'manager' ? 'Manager' : 'Employee'}</Button>} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {(['manager', 'employee'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                tab === t ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}>
              {t === 'manager' ? <UserCog className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {t === 'manager' ? 'Managers' : 'Employees'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm focus-ring sm:w-64" />
        </div>
      </div>

      {isLoading ? <TableSkeleton /> : !users?.length ? (
        <EmptyState icon={Users} title={`No ${tab}s found`} description="Add people to your organization." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add {tab}</Button>} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <SortHeader label="Name" columnKey="name" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} />
                <SortHeader label="Role / Title" columnKey="jobTitle" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} className="hidden sm:table-cell" />
                <SortHeader label="Department" columnKey="department" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} className="hidden md:table-cell" />
                {tab === 'employee' && <SortHeader label="Reports to" columnKey="manager" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} className="hidden lg:table-cell" />}
                <SortHeader label="Status" columnKey="status" activeKey={table.sortKey} dir={table.sortDir} onSort={table.toggleSort} className="hidden sm:table-cell" />
                <SortHeader label="Actions" align="right" />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((u: User) => (
                <tr key={u._id} className={cn('border-b border-border transition-colors odd:bg-surface even:bg-muted/30 hover:bg-accent/50', !u.isActive && 'opacity-60')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell"><span className="text-muted-foreground">{u.jobTitle || '—'}</span></td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {(u.department as Department)?.name ? <Badge>{(u.department as Department).name}</Badge> : '—'}
                  </td>
                  {tab === 'employee' && <td className="hidden px-4 py-3 lg:table-cell text-muted-foreground">{(u.manager as User)?.name || '—'}</td>}
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      u.isActive !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-500/15')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', u.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400')} />
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Dropdown trigger={<span className="inline-flex rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></span>}>
                      {(close) => (
                        <>
                          <DropdownItem onClick={() => { close(); openEdit(u); }}><Pencil className="h-4 w-4" /> Edit</DropdownItem>
                          <DropdownItem onClick={() => { close(); toggleActive(u); }}><Power className="h-4 w-4" /> {u.isActive !== false ? 'Deactivate' : 'Activate'}</DropdownItem>
                          <DropdownItem danger onClick={async () => { close(); if (confirm(`Remove ${u.name}?`)) { await remove.mutateAsync(u._id); toast.success('User removed'); } }}>
                            <Trash2 className="h-4 w-4" /> Remove
                          </DropdownItem>
                        </>
                      )}
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination page={table.page} totalPages={table.totalPages} total={table.total} pageSize={8} onPage={table.setPage} />
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : `Add ${tab === 'manager' ? 'Manager' : 'Employee'}`}
        description={editing ? 'Update this account\'s details.' : 'Create a new account and assign their role.'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={create.isPending || update.isPending}>{editing ? 'Save Changes' : 'Create Account'}</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Full name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" required /></FieldGroup>
            <FieldGroup label="Job title"><Input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Software Engineer" /></FieldGroup>
          </div>
          <FieldGroup label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" required /></FieldGroup>
          {!editing && (
            <FieldGroup label="Temporary password"><Input type="text" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 6 characters" required /></FieldGroup>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Department">
              <Select value={form.department} onChange={(e) => set('department', e.target.value)}>
                <option value="">Select…</option>
                {departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </Select>
            </FieldGroup>
            {tab === 'employee' && (
              <FieldGroup label="Reports to">
                <Select value={form.manager} onChange={(e) => set('manager', e.target.value)}>
                  <option value="">Select manager…</option>
                  {managers?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </Select>
              </FieldGroup>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
