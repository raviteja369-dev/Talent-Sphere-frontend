import type { Priority, TaskStatus } from './types';

interface BadgeStyle {
  label: string;
  className: string;
  dot: string;
}

// Soft, low-saturation badges. Status families:
//  completed → green · pending/review → amber · rejected/overdue → red
//  in review (admin) → purple · in progress / assigned → blue · idle → gray
const SOFT = {
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
} as const;

export const STATUS_CONFIG: Record<TaskStatus, BadgeStyle> = {
  not_started: { label: 'Not Started', className: SOFT.gray, dot: 'bg-gray-400' },
  assigned: { label: 'Assigned', className: SOFT.blue, dot: 'bg-blue-500' },
  accepted: { label: 'Accepted', className: SOFT.blue, dot: 'bg-blue-500' },
  declined: { label: 'Declined', className: SOFT.red, dot: 'bg-red-500' },
  in_progress: { label: 'In Progress', className: SOFT.blue, dot: 'bg-blue-600' },
  paused: { label: 'Paused', className: SOFT.amber, dot: 'bg-amber-500' },
  submitted_for_review: { label: 'Submitted for Review', className: SOFT.amber, dot: 'bg-amber-500' },
  manager_approved: { label: 'Manager Approved', className: SOFT.green, dot: 'bg-green-500' },
  manager_rejected: { label: 'Manager Rejected', className: SOFT.red, dot: 'bg-red-500' },
  sent_to_admin: { label: 'Sent to Admin', className: SOFT.purple, dot: 'bg-purple-500' },
  admin_approved: { label: 'Admin Approved', className: SOFT.green, dot: 'bg-green-500' },
  admin_rejected: { label: 'Admin Rejected', className: SOFT.red, dot: 'bg-red-500' },
  completed: { label: 'Completed', className: SOFT.green, dot: 'bg-green-600' },
  overdue: { label: 'Overdue', className: SOFT.red, dot: 'bg-red-600' },
};

export const PRIORITY_CONFIG: Record<Priority, BadgeStyle> = {
  low: { label: 'Low', className: SOFT.gray, dot: 'bg-gray-400' },
  medium: { label: 'Medium', className: SOFT.blue, dot: 'bg-blue-500' },
  high: { label: 'High', className: SOFT.amber, dot: 'bg-amber-500' },
  critical: { label: 'Critical', className: SOFT.red, dot: 'bg-red-500' },
};

export function progressColor(progress: number) {
  // Progress scale: 0 gray · 30 amber · 60 blue · 90 purple · 100 green
  if (progress >= 100) return { bar: 'bg-green-600', text: 'text-green-700 dark:text-green-400', label: '100% Completed' };
  if (progress >= 90) return { bar: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', label: '90% Completed' };
  if (progress >= 60) return { bar: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-400', label: '60% Completed' };
  if (progress >= 30) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: '30% Completed' };
  return { bar: 'bg-gray-300 dark:bg-gray-600', text: 'text-muted-foreground', label: 'Not Started' };
}

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export const STATUS_FILTERS: { value: TaskStatus; label: string }[] = (
  Object.keys(STATUS_CONFIG) as TaskStatus[]
).map((k) => ({ value: k, label: STATUS_CONFIG[k].label }));
