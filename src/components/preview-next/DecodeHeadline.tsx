import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * DecodeHeadline — "wow" variant: the headline assembles itself out of
 * scrambling glyphs, locking left-to-right into the final words. Letters/digits
 * scramble; spaces and punctuation are stable for readability. Direct DOM
 * writes in a single rAF loop (no React churn). Reduced-motion shows the final
 * text instantly.
 */
type Part = { text: string; cls?: string };
type DLine = Part[];

const GLYPHS = 'ABCDEFGHKLMNPQRSTUXZ0123456789#%&$@/<>≈';

export default function DecodeHeadline({
  lines, className, style,
}: { lines: DLine[]; className?: string; style?: CSSProperties }) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const spans = Array.from(root.querySelectorAll<HTMLElement>('[data-final]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      spans.forEach((s) => { s.textContent = s.dataset.final || ''; s.style.opacity = '1'; });
      return;
    }
    const stagger = 36;   // ms between each char starting to lock
    const scramble = 380; // ms each char spends scrambling
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = now - t0;
      let done = true;
      spans.forEach((s, i) => {
        const end = i * stagger + scramble;
        if (t >= end) {
          s.textContent = s.dataset.final || '';
          s.style.opacity = '1';
        } else {
          done = false;
          s.style.opacity = '0.85';
          s.textContent = GLYPHS[(Math.floor(t / 42) + i * 7) % GLYPHS.length];
        }
      });
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lines]);

  return (
    <h1 ref={rootRef} className={`pn-decode ${className ?? ''}`} style={style}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.map((p, pi) => (
            <span key={pi} className={p.cls}>
              {Array.from(p.text).map((ch, ci) => {
                if (ch === ' ') return <span key={ci}>{' '}</span>;
                const alnum = /[\p{L}\p{N}]/u.test(ch);
                if (!alnum) return <span key={ci}>{ch}</span>;
                return (
                  <span key={ci} data-final={ch} style={{ opacity: 0 }}>{ch}</span>
                );
              })}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
