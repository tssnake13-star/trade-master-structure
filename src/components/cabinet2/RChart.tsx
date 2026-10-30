import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fmtR } from './journal';

/** плавная линия через точки (Catmull-Rom → кривые Безье) */
function smooth(pts: [number, number][]) {
  if (!pts.length) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export interface RPoint { label: string; value: number; note?: string }

const DRAW_MS = 3000;   // линия рисуется
const FADE_MS = 700;    // гаснет
const LOOP_MS = 7000;   // весь круг

/**
 * Накопленный итог решений в R (кабинет v2, 29.10.2026, образец — ролик Kerfa): линия латунью прорисовывается,
 * под ней мягкая заливка, при наведении — вертикаль, точка и плашка с цифрой. Только настоящие итоги из журнала.
 */
export default function RChart({ points, height = 250, compact = false }: { points: RPoint[]; height?: number; compact?: boolean }) {
  // ширина рисунка = настоящая ширина карточки: на широком экране график длиннее, но не выше, и подписи не растут
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  const H = height, pad = { l: 44, r: 12, t: 14, b: compact ? 10 : 26 };
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => { if (el.clientWidth) setW(Math.round(el.clientWidth)); };
    fit();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [points.length < 2]);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geo = useMemo(() => {
    const vals = points.map((p) => p.value);
    const lo = Math.floor(Math.min(0, ...vals) - 0.5), hi = Math.ceil(Math.max(0, ...vals) + 0.5);
    const n = Math.max(points.length - 1, 1);
    const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / n;
    const y = (v: number) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo || 1);
    const pts = points.map((p, i) => [x(i), y(p.value)] as [number, number]);
    const ticks = Array.from({ length: 5 }, (_, k) => lo + ((hi - lo) * k) / 4);
    return { x, y, pts, lo, hi, ticks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, H, W]);

  // Кабинет перерисовывается каждую секунду (обратный отсчёт эфира), поэтому анимация привязана к самим значениям, а не к массиву
  const sig = points.map((p) => p.value).join(',');
  const anims = useRef<Animation[]>([]);

  // 30.10.2026, Сергей: «она очень быстро появляется… плавнее», потом «она же зациклена была… должна повторяться. Просто плавнее».
  // Круг: линия рисуется DRAW_MS равномерно с мягким началом и концом, заливка проявляется вместе с ней, точка загорается, когда
  // линия до неё дошла; всё держится и мягко гаснет, потом сначала. Прежний повтор выходил случайно: линия перезапускалась
  // каждую секунду вместе с отсчётом и за 0,3 с вылетала почти целиком.
  useLayoutEffect(() => {
    const el = lineRef.current, area = areaRef.current, dot = dotRef.current;
    if (!el || !area || !dot) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const drawn = DRAW_MS / LOOP_MS, hold = (LOOP_MS - FADE_MS) / LOOP_MS;
    const timing = { duration: LOOP_MS, iterations: Infinity };
    anims.current = [
      el.animate([
        { strokeDashoffset: len, opacity: 1, offset: 0, easing: 'cubic-bezier(.45,.05,.55,.95)' },
        { strokeDashoffset: 0, opacity: 1, offset: drawn },
        { strokeDashoffset: 0, opacity: 1, offset: hold, easing: 'ease-in-out' },
        { strokeDashoffset: 0, opacity: 0, offset: 1 },
      ], timing),
      area.animate([
        { opacity: 0, offset: 0, easing: 'ease-in' },
        { opacity: 1, offset: drawn },
        { opacity: 1, offset: hold, easing: 'ease-in-out' },
        { opacity: 0, offset: 1 },
      ], timing),
      dot.animate([
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: (DRAW_MS - 150) / LOOP_MS },
        { opacity: 1, offset: (DRAW_MS + 200) / LOOP_MS },
        { opacity: 1, offset: hold, easing: 'ease-in-out' },
        { opacity: 0, offset: 1 },
      ], timing),
    ];
    return () => {
      anims.current.forEach((x) => x.cancel());
      anims.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, W, H]);

  // пока человек читает значение под курсором, линия стоит целиком и не гаснет
  const hovering = hover != null;
  useLayoutEffect(() => {
    for (const x of anims.current) {
      if (hovering) {
        x.pause();
        x.currentTime = DRAW_MS + 250;
      } else {
        x.play();
      }
    }
  }, [hovering]);

  if (points.length < 2) return <div className="cv2-hint" style={{ padding: '30px 0' }}>Итогов пока мало для графика.</div>;

  const { x, y, pts, lo, ticks } = geo;
  const last = points.length - 1;
  const step = Math.max(1, Math.ceil(points.length / 6));
  const onMove = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * last);
    setHover(Math.max(0, Math.min(last, i)));
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', marginTop: 10 }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', width: '100%', height: H, overflow: 'visible' }} role="img"
        aria-label={`Итог решений ${fmtR(points[last].value)}`}>
        <defs>
          <linearGradient id="cv2R" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDAA6E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#CDAA6E" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(200,215,240,.07)" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" style={{ fill: 'var(--faint)', font: '11px var(--mono)' }}>{fmtR(v, 0)}</text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="rgba(200,215,240,.22)" strokeDasharray="2 4" />
        {!compact && points.map((p, i) => (i % step === 0 || i === last) && (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" style={{ fill: 'var(--faint)', font: '11px var(--mono)' }}>{p.label}</text>
        ))}
        <path ref={areaRef} d={`${smooth(pts)} L${x(last)},${y(lo)} L${x(0)},${y(lo)} Z`} fill="url(#cv2R)" />
        <path ref={lineRef} d={smooth(pts)} fill="none" stroke="#CDAA6E" strokeWidth={2.6} strokeLinecap="round" />
        <circle ref={dotRef} cx={x(last)} cy={y(points[last].value)} r={4.5} fill="#CDAA6E" />
        {hover != null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgba(230,236,245,.25)" />
            <circle cx={x(hover)} cy={y(points[hover].value)} r={5} fill="#E6ECF5" stroke="#CDAA6E" strokeWidth={2} />
          </>
        )}
        <rect x={pad.l} y={0} width={W - pad.l - pad.r} height={H} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover != null && (
        <div style={{
          position: 'absolute', left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].value) / H) * 100}%`, transform: 'translate(-50%, -118%)',
          pointerEvents: 'none', padding: '7px 10px', borderRadius: 10, fontSize: 12.5, background: 'rgba(230,236,245,.95)', color: '#0B1120',
          whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.35)',
        }}>
          <b style={{ display: 'block', fontSize: 14 }}>{fmtR(points[hover].value)}</b>
          <span style={{ color: '#4b5770' }}>{points[hover].label}{points[hover].note ? ` · ${points[hover].note}` : ''}</span>
        </div>
      )}
    </div>
  );
}
