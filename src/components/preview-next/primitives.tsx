import {
  useEffect, useRef, useState, type ReactNode, type CSSProperties, type ElementType,
} from 'react';

/* =====================================================================
   Shared kinetic primitives for /preview-next.
   IntersectionObserver-driven, reduced-motion aware, zero deps.
   ===================================================================== */

/** Adds `is-in` to the element the first time it scrolls into view. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/**
 * KineticHeadline — splits text into masked lines whose words rise into place
 * with a staggered cascade. Pass an array of "lines"; each line is a string or
 * a list of segments so a phrase can carry the gold accent / underline.
 */
type Seg = { text: string; gold?: boolean; uline?: boolean; mute?: boolean; flow?: boolean };
type SegItem = string | Seg;
type Line = string | SegItem[];

export function KineticHeadline({
  lines, as: Tag = 'h1', className, style,
}: { lines: Line[]; as?: ElementType; className?: string; style?: CSSProperties }) {
  const ref = useInView<HTMLHeadingElement>(0.3);
  let wi = 0;
  return (
    <Tag ref={ref as never} className={`pn-reveal ${className ?? ''}`} style={style}>
      {lines.map((line, li) => {
        // A line may be a bare string, or an array mixing strings and Seg
        // objects — normalize every element to a Seg so seg.text is defined.
        const raw: SegItem[] = typeof line === 'string' ? [line] : line;
        const segs: Seg[] = raw.map((s) => (typeof s === 'string' ? { text: s } : s));
        return (
          <span className="pn-line" key={li}>
            {segs.map((seg, si) => {
              const words = seg.text.split(/(\s+)/);
              const cls = [
                seg.flow ? 'pn-flow' : seg.gold ? 'pn-gold' : '',
                seg.uline ? 'pn-uline' : '',
                seg.mute ? 'mute' : '',
              ].join(' ').trim();
              return (
                <span key={si} className={cls}>
                  {words.map((wd, j) => {
                    if (wd.trim() === '') return <span key={j}>{wd}</span>;
                    const i = wi++;
                    return (
                      <span key={j} className="pn-word" style={{ ['--i' as string]: i }}>
                        {wd}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}

/** Count-up number that animates the first time it enters the viewport. */
export function CountUp({
  to, duration = 1400, decimals = 0, prefix = '', suffix = '', className, style,
}: {
  to: number; duration?: number; decimals?: number;
  prefix?: string; suffix?: string; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(to); return; }
    let raf = 0, started = false;
    const run = () => {
      if (started) return;
      started = true;
      io.disconnect();
      let s = 0;
      const step = (t: number) => {
        if (!s) s = t;
        const p = Math.min(1, (t - s) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) run();
    }, { threshold: 0.6 });
    io.observe(el);
    // Fallback: if already in view at mount, start immediately (covers
    // environments that don't deliver the initial IO callback without a scroll).
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) run();
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return (
    <span ref={ref} className={`pn-num ${className ?? ''}`} style={style}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

/** Card whose border + fill glow track the cursor (CSS vars --mx/--my). */
export function SpotlightCard({
  children, className, style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} className={`pn-card ${className ?? ''}`} style={style} onPointerMove={onMove}>
      {children}
    </div>
  );
}
