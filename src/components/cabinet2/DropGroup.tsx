import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Группа кнопок с «каплей» (29.10.2026, образец Сергея — ролик Kerfa, приём slidePill): подсветка перетекает
 * с выбранной кнопки на новую, ведущий край идёт первым и быстрее, задний догоняет — по пути пилюля
 * вытягивается, на месте сжимается. Края у пилюли с разной скоростью, поэтому она растягивается на обе кнопки,
 * а края режет clip-path, кадр за кадром.
 */
export default function DropGroup<K extends string>({
  items,
  value,
  onChange,
  variant = '',
  role = 'group',
  label,
  className = '',
}: {
  items: { key: K; label: ReactNode; hidden?: boolean }[];
  value: K;
  onChange: (k: K) => void;
  variant?: '' | 'sm' | 'brass' | 'sm brass';
  role?: 'group' | 'tablist';
  label: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drop = useRef<HTMLSpanElement>(null);
  const last = useRef<{ l: number; r: number } | null>(null);
  const raf = useRef(0);

  const place = (animate: boolean) => {
    const g = box.current, d = drop.current;
    if (!g || !d) return;
    const btn = g.querySelector<HTMLElement>(`[data-k="${CSS.escape(value)}"]`);
    if (!btn) return;
    const L = btn.offsetLeft, R = L + btn.offsetWidth;
    const prev = last.current;
    last.current = { l: L, r: R };
    const st = d.style;
    cancelAnimationFrame(raf.current);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || !prev || reduce || (prev.l === L && prev.r === R)) {
      st.left = `${L}px`; st.width = `${R - L}px`; st.clipPath = 'none';
      return;
    }
    const right = L > prev.l;
    const minL = Math.min(L, prev.l), maxR = Math.max(R, prev.r);
    st.left = `${minL}px`; st.width = `${maxR - minL}px`;
    const from = { l: prev.l - minL, r: maxR - prev.r }, to = { l: L - minL, r: maxR - R };
    const LEAD = 320, TRAIL = 600, t0 = performance.now();
    const out = (t: number) => 1 - Math.pow(1 - t, 3);
    const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now: number) => {
      const tl = Math.min(1, (now - t0) / (right ? TRAIL : LEAD));
      const tr = Math.min(1, (now - t0) / (right ? LEAD : TRAIL));
      const l = from.l + (to.l - from.l) * (right ? inOut(tl) : out(tl));
      const r = from.r + (to.r - from.r) * (right ? out(tr) : inOut(tr));
      st.clipPath = `inset(0 ${r}px 0 ${l}px round 999px)`;
      if (tl < 1 || tr < 1) raf.current = requestAnimationFrame(step);
      else { st.left = `${L}px`; st.width = `${R - L}px`; st.clipPath = 'none'; }
    };
    raf.current = requestAnimationFrame(step);
  };

  useIsoLayoutEffect(() => { place(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value, items.length]);
  useEffect(() => {
    const onResize = () => place(false);
    window.addEventListener('resize', onResize);
    // шрифт подгрузился — ширины кнопок поменялись
    document.fonts?.ready.then(() => place(false)).catch(() => {});
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const tabs = role === 'tablist';
  return (
    <div ref={box} className={`cv2-drop-group ${variant} ${className}`} role={role} aria-label={label}>
      <span ref={drop} className="cv2-drop" aria-hidden="true" />
      {items.filter((it) => !it.hidden).map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            data-k={it.key}
            role={tabs ? 'tab' : undefined}
            aria-selected={tabs ? on : undefined}
            aria-pressed={tabs ? undefined : on}
            onClick={() => { if (!on) onChange(it.key); }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
