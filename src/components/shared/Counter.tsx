import { useEffect, useRef, useState } from 'react';
import { nFormat } from '@/lib/utils';

/**
 * Animated number that counts up to `value` once it mounts.
 * Falls back to rendering the raw string when `value` is not numeric.
 */
export function Counter({
  value,
  duration = 900,
  suffix = '',
  className,
}: {
  value: number | string;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const numeric = typeof value === 'number';
  const target = numeric ? value : 0;
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (!numeric) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, numeric]);

  if (!numeric) return <span className={className}>{value}</span>;
  return (
    <span className={className}>
      {nFormat(Math.round(display))}
      {suffix}
    </span>
  );
}
