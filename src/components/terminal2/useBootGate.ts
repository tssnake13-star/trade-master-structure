import { useEffect, useRef, useState } from 'react';

// запуск терминала (25.10.2026): первый раз за сеанс — не короче 1,5 с, чтобы глаз успел нарисоваться и открыться
const BOOT_MIN = 1500;
const BOOT_SEEN = 'eg_boot_seen';

/**
 * 25.10.2026, его выбор «A-C-D вместе»: пока грузятся данные — запуск (строки готовности по настоящим запросам),
 * потом скан открывает окно (scan), дальше окно живёт. Первый раз за сеанс запуск стоит не меньше BOOT_MIN,
 * потом — ровно столько, сколько грузятся данные. При «меньше движения» скана нет.
 */
export function useBootGate(ready: boolean) {
  const bootAt = useRef(typeof performance === 'undefined' ? 0 : performance.now());
  const [hold, setHold] = useState(true);
  const [scan, setScan] = useState(false);
  useEffect(() => {
    if (!ready) return;
    let first = true;
    try {
      first = !sessionStorage.getItem(BOOT_SEEN);
      sessionStorage.setItem(BOOT_SEEN, '1');
    } catch {
      /* без хранилища — как в первый раз */
    }
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = first && !calm ? Math.max(0, BOOT_MIN - (performance.now() - bootAt.current)) : 0;
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      setHold(false);
      if (calm) return;
      setScan(true);
      t2 = window.setTimeout(() => setScan(false), 1600);
    }, wait);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready]);
  return { hold, scan };
}
