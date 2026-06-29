import { Check, X, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';

type StepState = 'done' | 'current' | 'rejected' | 'pending';

function stepState(task: Task, step: 'employee' | 'manager' | 'admin'): StepState {
  const s = task.status;
  if (step === 'employee') {
    if (['submitted_for_review', 'sent_to_admin', 'manager_approved', 'admin_approved', 'completed'].includes(s)) return 'done';
    if (s === 'manager_rejected') return 'rejected';
    return 'current';
  }
  if (step === 'manager') {
    if (['sent_to_admin', 'manager_approved', 'admin_approved', 'completed'].includes(s)) return 'done';
    if (s === 'manager_rejected') return 'rejected';
    if (s === 'submitted_for_review') return 'current';
    if (s === 'admin_rejected') return 'current';
    return 'pending';
  }
  // admin
  if (['admin_approved', 'completed'].includes(s)) return 'done';
  if (s === 'admin_rejected') return 'rejected';
  if (s === 'sent_to_admin') return 'current';
  return 'pending';
}

const STEPS = [
  { key: 'employee' as const, label: 'Employee', sub: 'Execution' },
  { key: 'manager' as const, label: 'Manager', sub: 'Review' },
  { key: 'admin' as const, label: 'Admin', sub: 'Final Approval' },
];

export function WorkflowStepper({ task }: { task: Task }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const state = stepState(task, step.key);
        const Icon = state === 'done' ? Check : state === 'rejected' ? X : state === 'current' ? Loader2 : Circle;
        return (
          <div key={step.key} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  state === 'done' && 'border-emerald-500 bg-emerald-500 text-white',
                  state === 'current' && 'border-primary bg-primary/10 text-primary',
                  state === 'rejected' && 'border-rose-500 bg-rose-500 text-white',
                  state === 'pending' && 'border-border bg-surface text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', state === 'current' && 'animate-spin')} />
              </div>
              <p className={cn('mt-2 text-xs font-semibold', state === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>{step.label}</p>
              <p className="text-[10px] text-muted-foreground">{step.sub}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 mb-8 h-0.5 flex-1 rounded-full', state === 'done' ? 'bg-emerald-500' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
