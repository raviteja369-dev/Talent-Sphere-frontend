import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn, nFormat } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  hint?: string;
  delay?: number;
}

const tones: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-blue-900/10 dark:bg-blue-500/15', text: 'text-blue-900 dark:text-blue-300' },
  emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-700 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-red-600/10', text: 'text-red-700 dark:text-red-400' },
  sky: { bg: 'bg-blue-600/10', text: 'text-blue-700 dark:text-blue-400' },
  violet: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300' },
};

export function StatCard({ label, value, icon: Icon, tone = 'indigo', hint, delay = 0 }: StatCardProps) {
  const t = tones[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="card group p-5 transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
            {typeof value === 'number' ? nFormat(value) : value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110', t.bg)}>
          <Icon className={cn('h-5 w-5', t.text)} />
        </div>
      </div>
    </motion.div>
  );
}
