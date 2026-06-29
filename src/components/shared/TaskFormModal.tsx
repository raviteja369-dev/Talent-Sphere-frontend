import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FieldGroup } from '@/components/ui/Field';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useUsers, useTaskMutations } from '@/hooks/queries';
import { apiError } from '@/lib/api';
import { PRIORITIES } from '@/lib/constants';

export function TaskFormModal({
  open,
  onClose,
  parentTaskId,
  defaultProject,
}: {
  open: boolean;
  onClose: () => void;
  parentTaskId?: string;
  defaultProject?: string;
}) {
  const { user } = useAuth();
  const { create } = useTaskMutations();
  const { data: projects } = useProjects();
  // Admin assigns to managers; manager assigns to their employees
  const { data: assignees } = useUsers({ role: user?.role === 'admin' ? 'manager' : 'employee' });

  const [form, setForm] = useState({
    title: '', description: '', project: defaultProject || '', assignedTo: '',
    priority: 'medium', startDate: '', dueDate: '', instructions: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assignedTo) return toast.error('Title and assignee are required');
    try {
      await create.mutateAsync({
        ...form,
        parentTask: parentTaskId,
        project: form.project || undefined,
      } as any);
      toast.success('Task assigned successfully');
      setForm({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', startDate: '', dueDate: '', instructions: '' });
      onClose();
    } catch (err) {
      toast.error(apiError(err, 'Could not create task'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={parentTaskId ? 'Create Subtask' : 'Assign New Task'}
      description={user?.role === 'admin' ? 'Delegate work to a manager.' : 'Break work down and assign it to a team member.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={create.isPending}>Assign Task</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldGroup label="Task title">
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Implement authentication module" required />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the scope and goals…" />
        </FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label={user?.role === 'admin' ? 'Assign to manager' : 'Assign to employee'}>
            <Select value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} required>
              <option value="">Select…</option>
              {assignees?.filter((a) => a._id !== user?._id).map((a) => (
                <option key={a._id} value={a._id}>{a.name} — {a.jobTitle}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Project">
            <Select value={form.project} onChange={(e) => set('project', e.target.value)}>
              <option value="">No project</option>
              {projects?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </FieldGroup>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup label="Priority">
            <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Start date">
            <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Due date">
            <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </FieldGroup>
        </div>
        <FieldGroup label="Instructions">
          <Textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Add detailed instructions, acceptance criteria…" className="min-h-[70px]" />
        </FieldGroup>
      </form>
    </Modal>
  );
}
