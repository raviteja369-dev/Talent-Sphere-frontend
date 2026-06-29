interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  suffix?: string;
}

export function ChartTooltip({ active, payload, label, suffix = '' }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-elevated px-3 py-2 shadow-elevated">
      {label && <p className="mb-1 text-xs font-medium text-foreground">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}
