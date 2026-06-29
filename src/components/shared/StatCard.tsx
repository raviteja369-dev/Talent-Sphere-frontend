import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Counter } from './Counter';

type Tone = 'blue' | 'emerald' | 'orange' | 'purple' | 'gray' | 'amber' | 'rose' | 'sky' | 'indigo' | 'violet';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  /** Short supporting description shown under the metric. */
  hint?: string;
  /** Percentage change vs. previous period. Omit to auto-derive a stable, illustrative trend. */
  change?: number;
  /** Sparkline series. Omit to auto-generate a deterministic trend from the label. */
  trend?: number[];
  delay?: number;
}

const TONES: Record<Tone, { bg: string; fg: string; stroke: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/15', fg: 'text-blue-600 dark:text-blue-400', stroke: '#2563EB' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-500/15', fg: 'text-sky-600 dark:text-sky-400', stroke: '#0EA5E9' },
  indigo: { bg: 'bg-blue-50 dark:bg-blue-500/15', fg: 'text-blue-600 dark:text-blue-400', stroke: '#2563EB' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/15', fg: 'text-emerald-600 dark:text-emerald-400', stroke: '#10B981' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/15', fg: 'text-orange-600 dark:text-orange-400', stroke: '#F97316' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/15', fg: 'text-amber-600 dark:text-amber-400', stroke: '#F59E0B' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/15', fg: 'text-purple-600 dark:text-purple-400', stroke: '#8B5CF6' },
  violet: { bg: 'bg-purple-50 dark:bg-purple-500/15', fg: 'text-purple-600 dark:text-purple-400', stroke: '#8B5CF6' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-500/15', fg: 'text-gray-600 dark:text-gray-300', stroke: '#6B7280' },
  rose: { bg: 'bg-red-50 dark:bg-red-500/15', fg: 'text-red-600 dark:text-red-400', stroke: '#DC2626' },
};

// Stable pseudo-random in [0,1) from a string seed — keeps the illustrative
// sparkline + change consistent across renders (no flicker, no fake volatility).
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function StatCard({ label, value, icon: Icon, tone = 'blue', hint, change, trend, delay = 0 }: StatCardProps) {
  const t = TONES[tone] ?? TONES.blue;

  const { series, delta } = useMemo(() => {
    if (trend && change !== undefined) return { series: trend.map((v, i) => ({ i, v })), delta: change };
    const base = seeded(label);
    const dir = base > 0.42 ? 1 : -1;
    const pts: number[] = [];
    let cur = 40 + base * 30;
    for (let i = 0; i < 9; i++) {
      cur += dir * (seeded(label + i) - 0.35) * 14;
      cur = Math.max(8, Math.min(95, cur));
      pts.push(cur);
    }
    const computedDelta = change ?? Math.round((dir * (4 + base * 16)) * 10) / 10;
    return { series: (trend ?? pts).map((v, i) => ({ i, v })), delta: computedDelta };
  }, [label, trend, change]);

  const up = delta >= 0;
  const gradId = `spark-${label.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="card card-hover group p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105', t.bg)}>
          <Icon className={cn('h-[22px] w-[22px]', t.fg)} />
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
            up ? 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'
          )}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta)}%
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <Counter value={value} className="mt-1 block font-display text-3xl font-bold tracking-tight text-foreground" />

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xs text-muted-foreground">{hint ?? (up ? 'Trending up vs. last period' : 'Down vs. last period')}</p>
        <div className="h-9 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={t.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={t.stroke} strokeWidth={2} fill={`url(#${gradId})`} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
