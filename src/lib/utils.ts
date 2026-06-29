import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: string | Date | null) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date?: string | Date | null) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
}

export function timeAgo(date?: string | Date | null) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date?: string | Date | null) {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500',
];

export function avatarColor(seed?: string) {
  if (!seed) return AVATAR_COLORS[0];
  const sum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function nFormat(n: number) {
  return new Intl.NumberFormat('en-US').format(n ?? 0);
}
