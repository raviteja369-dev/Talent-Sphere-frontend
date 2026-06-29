import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDir } from '@/hooks/useTable';

export function SortHeader({
  label,
  columnKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
  className,
}: {
  label: string;
  columnKey?: string;
  activeKey?: string | null;
  dir?: SortDir;
  onSort?: (key: string) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const sortable = !!columnKey && !!onSort;
  const active = activeKey === columnKey;
  return (
    <th className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>
      {sortable ? (
        <button onClick={() => onSort!(columnKey!)} className={cn('inline-flex items-center gap-1.5 transition-colors hover:text-foreground', active && 'text-foreground')}>
          {label}
          {active ? (
            dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </button>
      ) : (
        label
      )}
    </th>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Compact page window
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–<span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors',
              p === page ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-muted'
            )}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="px-1 text-xs text-muted-foreground">…</span>}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
