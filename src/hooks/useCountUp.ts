import { useEffect, useRef, useState } from 'react';

/**
 * Число набегает до значения (25.10.2026, идея 1 «прогресс досчитывается»): при первом показе — с нуля,
 * при изменении — от прежнего значения. При «меньше движения» сразу ставит значение.
 */
const calm = () => typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useCountUp(target: number, ms = 1200, decimals = 0) {
  const [val, setVal] = useState(() => (calm() ? target : 0));
  const from = useRef(0);
  useEffect(() => {
    if (calm()) {
      setVal(target);
      from.current = target;
      return;
    }
    const start = from.current;
    const k = 10 ** decimals;
    let raf = 0, t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / ms);
      setVal(Math.round((start + (target - start) * (1 - Math.pow(1 - p, 3))) * k) / k);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, decimals]);
  return val;
}
