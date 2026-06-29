import type { Priority, TaskStatus } from './types';

interface BadgeStyle {
  label: string;
  className: string;
  dot: string;
}

export const STATUS_CONFIG: Record<TaskStatus, BadgeStyle> = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300', dot: 'bg-slate-400' },
  assigned: { label: 'Assigned', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', dot: 'bg-blue-600' },
  submitted_for_review: { label: 'Submitted for Review', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  manager_approved: { label: 'Manager Approved', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  manager_rejected: { label: 'Manager Rejected', className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', dot: 'bg-red-500' },
  sent_to_admin: { label: 'Sent to Admin', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', dot: 'bg-indigo-500' },
  admin_approved: { label: 'Admin Approved', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  admin_rejected: { label: 'Admin Rejected', className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', dot: 'bg-red-500' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300', dot: 'bg-green-600' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', dot: 'bg-red-700' },
};

export const PRIORITY_CONFIG: Record<Priority, BadgeStyle> = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300', dot: 'bg-slate-400' },
  medium: { label: 'Medium', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', dot: 'bg-blue-500' },
  high: { label: 'High', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', dot: 'bg-red-500' },
};

export function progressColor(progress: number) {
  // Enterprise progress scale: 0 gray · 30 amber · 60 blue · 90 indigo · 100 green
  if (progress >= 100) return { bar: 'bg-green-600', text: 'text-green-700 dark:text-green-400', label: '100% Completed' };
  if (progress >= 90) return { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', label: '90% Completed' };
  if (progress >= 60) return { bar: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-400', label: '60% Completed' };
  if (progress >= 30) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: '30% Completed' };
  return { bar: 'bg-slate-300 dark:bg-slate-600', text: 'text-muted-foreground', label: 'Not Started' };
}

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export const STATUS_FILTERS: { value: TaskStatus; label: string }[] = (
  Object.keys(STATUS_CONFIG) as TaskStatus[]
).map((k) => ({ value: k, label: STATUS_CONFIG[k].label }));
