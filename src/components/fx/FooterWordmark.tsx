import { useEffect, useRef } from 'react';

/**
 * Большая надпись TRADELIKETYO в подвале (23.10.2026, по мотивам Aceternity «Text Hover Effect»).
 * Контур и лёгкая заливка стоят сразу (прорисовку контура при появлении сняли с обликом, шаг 4:
 * ниже первого экрана ничего не движется само). На компьютере под курсором буквы светятся ярче.
 * Надпись — украшение: для чтения экраном она скрыта, название школы стоит в подвале обычным текстом.
 */
export default function FooterWordmark() {
  const wrap = useRef<HTMLDivElement>(null);
  const hot = useRef<SVGRadialGradientElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const svg = el.querySelector('svg');
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!svg || !hot.current) return;
        const r = svg.getBoundingClientRect();
        hot.current.setAttribute('cx', `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
        hot.current.setAttribute('cy', `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const text = (cls: string, fill?: string) => (
    <text
      className={`fx-wm-text ${cls}`}
      x="500"
      y="96"
      textAnchor="middle"
      textLength="960"
      lengthAdjust="spacingAndGlyphs"
      fontSize="118"
      fill={fill}
    >
      TRADELIKETYO
    </text>
  );

  return (
    <div ref={wrap} className="fx-wordmark" aria-hidden="true">
      <svg viewBox="0 0 1000 130" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="fxWmFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(37 65% 70%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(37 65% 70%)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="fxWmHot" ref={hot} cx="50%" cy="50%" r="22%">
            <stop offset="0%" stopColor="#fff1d2" stopOpacity="0.95" />
            <stop offset="45%" stopColor="hsl(37 65% 70%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(37 65% 70%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {text('fx-wm-fill', 'url(#fxWmFill)')}
        {text('fx-wm-hot', 'url(#fxWmHot)')}
        {text('fx-wm-stroke')}
      </svg>
    </div>
  );
}
