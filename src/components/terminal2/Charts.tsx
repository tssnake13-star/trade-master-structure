import { useEffect, useRef, useState, type ReactNode } from 'react';
import { niceTicks } from '@/components/terminal/scene';
import { ddmm, dayAst, fmtNum, fmtR, msOf, type DayCount, type DirCell, type RPoint } from './derive';

/**
 * Графики приборов (SVG): итог решений в R — плавная линия с подсказкой при наведении (как график «Решения
 * системы в R» в принятом прототипе кабинета), допуски и отказы по дням — столбики, пары в направлении — полоса.
 * Линия рисуется один раз, когда пришли данные; цифры не двигаются, пока не изменились сами данные.
 */

type Pt = [number, number];
/** Плавная линия без выбросов (монотонная кубическая, Фрич — Карлсон): между двумя сделками линия не уходит выше
 *  и ниже их значений — итог на графике не рисует того, чего не было */
export function smooth(pts: Pt[]): string {
  const n = pts.length;
  if (!n) return '';
  const f = (v: number) => v.toFixed(1);
  if (n === 1) return `M${f(pts[0][0])},${f(pts[0][1])}`;
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0] || 1e-6;
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = new Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], q = a * a + b * b;
    if (q > 9) { const k = 3 / Math.sqrt(q); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f(pts[i][0] + h)},${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)},${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`;
  }
  return d;
}

function useWidth<T extends HTMLElement>(fallback = 600) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setW(Math.max(160, Math.round(el.clientWidth)));
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Малая линия прибора: накопленный итог, без осей */
export function Spark({ values, height = 34 }: { values: number[]; height?: number }) {
  const [box, W] = useWidth<HTMLDivElement>(180);
  const H = height;
  const lo = Math.min(0, ...values), hi = Math.max(0, ...values);
  const span = hi - lo || 1;
  const x = (i: number) => 2 + (i * (W - 4)) / Math.max(1, values.length - 1);
  const y = (v: number) => 3 + ((hi - v) * (H - 6)) / span;
  const pts = values.map((v, i) => [x(i), y(v)] as Pt);
  const sig = values.join(',');
  return (
    <div ref={box} className="tv2-spark" style={{ height: H }} aria-hidden="true">
      {values.length > 1 ? (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="tv2-zero" />
          <path key={sig} d={smooth(pts)} pathLength={1} className="tv2-line tv2-draw" />
          <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.6} className="tv2-end tv2-fade" />
        </svg>
      ) : null}
    </div>
  );
}

/** Большой график итога решений в R: накопленный итог по сделкам, наведение — дата, инструмент, сделка и итог */
export function RChart({ points, height = 260 }: { points: RPoint[]; height?: number }) {
  const [box, W] = useWidth<HTMLDivElement>(720);
  const [hi, setHi] = useState<number | null>(null);
  const H = height;
  const pad = { l: 46, r: 14, t: 14, b: 28 };
  const vals = [0, ...points.map((p) => p.cum)];
  const ticks = niceTicks(Math.min(0, ...vals), Math.max(0, ...vals) || 1, 5);
  const lo = Math.min(ticks[0], ...vals), top = Math.max(ticks[ticks.length - 1], ...vals);
  const span = top - lo || 1;
  const n = vals.length;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, n - 1);
  const y = (v: number) => pad.t + ((top - v) * (H - pad.t - pad.b)) / span;
  const pts = vals.map((v, i) => [x(i), y(v)] as Pt);
  const line = smooth(pts);
  const sig = vals.join(',');
  // подписи дат: не больше пяти, по сделкам
  const step = Math.max(1, Math.ceil(points.length / 5));
  const xl = points.map((p, i) => ({ i: i + 1, t: ddmm(dayAst(msOf(p.time))) })).filter((_, k) => k % step === 0);
  const move = (ev: React.PointerEvent<SVGRectElement>) => {
    const r = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1));
    setHi(Math.max(1, Math.min(n - 1, i)));
  };
  const p = hi != null ? points[hi - 1] : null;
  return (
    <div ref={box} className="tv2-chart">
      {points.length ? (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`Итог решений в R: ${fmtR(points[points.length - 1].cum)}`}>
          <defs>
            <linearGradient id="tv2-r-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDAA6E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#CDAA6E" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="tv2-grid" />
              <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="tv2-axis">
                {v > 0 ? '+' : v < 0 ? '−' : ''}
                {fmtNum(Math.abs(v), Number.isInteger(v) ? 0 : 1)}R
              </text>
            </g>
          ))}
          <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} className="tv2-zero" />
          {xl.map((l) => (
            <text key={l.i} x={x(l.i)} y={H - 8} textAnchor="middle" className="tv2-axis">
              {l.t}
            </text>
          ))}
          <path key={'a' + sig} d={`${line} L${x(n - 1).toFixed(1)},${y(lo).toFixed(1)} L${x(0).toFixed(1)},${y(lo).toFixed(1)} Z`} fill="url(#tv2-r-fill)" className="tv2-fade" />
          <path key={'l' + sig} d={line} pathLength={1} className="tv2-line tv2-line-big tv2-draw" />
          <circle cx={x(n - 1)} cy={y(vals[n - 1])} r={4.5} className="tv2-end tv2-fade" />
          {p && hi != null ? (
            <g pointerEvents="none">
              <line x1={x(hi)} x2={x(hi)} y1={pad.t} y2={H - pad.b} className="tv2-guide" />
              <circle cx={x(hi)} cy={y(vals[hi])} r={5} className="tv2-dot" />
            </g>
          ) : null}
          <rect x={pad.l} y={0} width={Math.max(0, W - pad.l - pad.r)} height={H} fill="transparent" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHi(null)} />
        </svg>
      ) : (
        <div className="tv2-empty" style={{ height: H }}>Итогов пока нет: они появляются после субботнего разбора недели.</div>
      )}
      {p && hi != null ? (
        <div className="tv2-tip" style={{ left: `${(x(hi) / W) * 100}%`, top: y(vals[hi]) }}>
          <b>{fmtR(p.cum)}</b>
          <span>
            {ddmm(dayAst(msOf(p.time)))} · {p.instrument} {p.side}
          </span>
          <span>сделка {fmtR(p.r)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Допуски и отказы столбиками: допуск — зелёным снизу, отказ — сталью сверху */
export function DayBars({ days, big = false, height, active, onPick }: { days: DayCount[]; big?: boolean; height?: number; active?: string | null; onPick?: (day: string) => void }) {
  const H = height ?? (big ? 200 : 46);
  const max = Math.max(1, ...days.map((d) => d.ok + d.no));
  const [hov, setHov] = useState<string | null>(null);
  const tipDay = days.find((d) => d.day === hov) || null;
  return (
    <div className={big ? 'tv2-bars big' : 'tv2-bars'} style={{ ['--bars-h' as string]: `${H}px` }}>
      <div className="tv2-bars-row" style={{ height: H }}>
        {days.map((d, i) => {
          const tot = d.ok + d.no;
          const body: ReactNode = tot ? (
            <span className="tv2-stk" style={{ height: `${(tot / max) * 100}%`, ['--i' as string]: i }}>
              {d.no ? <i className="no" style={{ flex: d.no }} /> : null}
              {d.ok ? <i className="ok" style={{ flex: d.ok }} /> : null}
            </span>
          ) : (
            <span className="tv2-stk nil" />
          );
          return big ? (
            <button
              key={d.day}
              type="button"
              className={active === d.day ? 'tv2-col on' : 'tv2-col'}
              onPointerEnter={() => setHov(d.day)}
              onPointerLeave={() => setHov(null)}
              onFocus={() => setHov(d.day)}
              onBlur={() => setHov(null)}
              onClick={() => onPick?.(d.day)}
              aria-label={`${d.label}: допусков ${d.ok}, отказов ${d.no}`}
            >
              {body}
            </button>
          ) : (
            <span key={d.day} className="tv2-col">
              {body}
            </span>
          );
        })}
      </div>
      <div className="tv2-bars-x">
        {days.map((d) => (
          <span key={d.day}>{d.label}</span>
        ))}
      </div>
      {big && tipDay ? (
        <div className="tv2-tip tv2-tip-bars" style={{ left: `${((days.indexOf(tipDay) + 0.5) / days.length) * 100}%` }}>
          <b>{tipDay.ok + tipDay.no ? `${tipDay.ok + tipDay.no} ${tipDay.ok + tipDay.no === 1 ? 'решение' : tipDay.ok + tipDay.no < 5 ? 'решения' : 'решений'}` : 'решений нет'}</b>
          <span>
            допуск {tipDay.ok} · отказ {tipDay.no}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** Пары в направлении: столбик вверх — неделя и дневка вместе вверх, вниз — вместе вниз; короткий бледный —
 *  смотрит только один таймфрейм; точка — направления нет */
export function DirStrip({ cells, height = 40 }: { cells: DirCell[]; height?: number }) {
  return (
    <div className="tv2-dirstrip" style={{ height }} aria-hidden="true">
      {cells.map((c, i) => {
        const one = c.agree ? null : c.w || c.d;
        const cls = c.agree ? (c.agree === 'LONG' ? 'up' : 'dn') : one ? (one === 'LONG' ? 'up half' : 'dn half') : 'nil';
        return <i key={c.r.symbol} className={cls} style={{ ['--i' as string]: i }} />;
      })}
    </div>
  );
}
