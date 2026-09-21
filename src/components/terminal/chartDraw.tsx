import type { ReactNode } from 'react';
import type { ScenePanel, Shape, SLabel } from './scene';

// Рисование фигур живого графика. Цвета поля — как на картинке бота.
export const PANEL_BG = '#161b22';
export const GRID = '#2a3038';
export const UPC = '#26a17b';
export const DNC = '#d1493f';
export const PAD = { l: 6, r: 56, t: 10, b: 24 };

/** По высоте: пока смотрим целиком — как на картинке (видна цель цикла); приблизили
 *  больше чем вдвое — подгоняем под видимые свечи, иначе они сплющиваются. */
export function yRange(p: ScenePanel, v: [number, number], full: [number, number]): [number, number] {
  const zoomed = v[1] - v[0] < 0.5 * (full[1] - full[0]);
  let lo = Infinity;
  let hi = -Infinity;
  p.bars.forEach((b, i) => {
    const x = p.x0 + i;
    if (x >= v[0] - 0.5 && x <= v[1] + 0.5) {
      lo = Math.min(lo, b[3]);
      hi = Math.max(hi, b[2]);
    }
  });
  if (zoomed) {
    for (const s of p.shapes) if (s.k === 'mark' && s.x >= v[0] && s.x <= v[1]) { lo = Math.min(lo, s.y); hi = Math.max(hi, s.y); }
    for (const l of p.labels) if (l.x >= v[0] && l.x <= v[1]) { lo = Math.min(lo, l.y); hi = Math.max(hi, l.y); }
  } else {
    lo = Math.min(lo, p.ylim[0]);
    hi = Math.max(hi, p.ylim[1]);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) [lo, hi] = p.ylim;
  const pad = (hi - lo) * (zoomed ? 0.08 : 0.02) || Math.abs(hi) * 0.001 || 1;
  return [lo - pad, hi + pad];
}

/** Знаков у подписи цены — по шагу шкалы, а не по котировке: 105, а не 105.000. */
export function tickDigits(step: number, dg: number) {
  if (!(step > 0)) return dg;
  const dec = (String(+step.toPrecision(3)).split('.')[1] || '').length;
  return Math.min(dec, Math.max(dg, 0) + 1);
}

export interface PlacedLabel extends SLabel {
  px: number;
  py: number;
  ax: number;
  ay: number;
  moved: boolean;
}

/** Номера пояснений: не наезжают друг на друга и не обрезаются краем поля.
 *  Номер, который пришлось сдвинуть, связан со своей точкой тонкой линией. */
export function placeLabels(
  labels: SLabel[],
  sx: (x: number) => number,
  sy: (y: number) => number,
  box: { x0: number; x1: number; y0: number; y1: number },
  r: number,
): PlacedLabel[] {
  const out: PlacedLabel[] = [];
  const d = 2 * r + 3;
  const tries: [number, number][] = [[0, 0], [0, d], [0, -d], [d, 0], [-d, 0], [d, d], [-d, -d], [d, -d], [-d, d], [0, 2 * d], [0, -2 * d]];
  const inside = (x: number, y: number) => x >= box.x0 + r && x <= box.x1 - r && y >= box.y0 + r && y <= box.y1 - r;
  for (const l of [...labels].sort((a, b) => a.n - b.n)) {
    const ax = sx(l.x);
    const ay = sy(l.y);
    if (ax < box.x0 - r || ax > box.x1 + r || ay < box.y0 - r || ay > box.y1 + r) continue; // вне видимого — не рисуем
    const cx = Math.min(Math.max(ax, box.x0 + r), box.x1 - r);
    const cy = Math.min(Math.max(ay, box.y0 + r), box.y1 - r);
    let pos: [number, number] = [cx, cy];
    for (const [dx, dy] of tries) {
      const x = cx + dx;
      const y = cy + dy;
      if (inside(x, y) && !out.some((o) => Math.hypot(o.px - x, o.py - y) < 2 * r + 1)) {
        pos = [x, y];
        break;
      }
    }
    out.push({ ...l, px: pos[0], py: pos[1], ax, ay, moved: Math.hypot(pos[0] - ax, pos[1] - ay) > 3 });
  }
  return out;
}

export function shapeNode(s: Shape, key: number, sx: (x: number) => number, sy: (y: number) => number): ReactNode {
  switch (s.k) {
    case 'line': {
      const lw = Math.max(0.8, s.w * 1.15);
      return (
        <polyline
          key={key}
          points={s.p.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ')}
          fill="none"
          stroke={s.c}
          strokeOpacity={s.a}
          strokeWidth={lw}
          strokeDasharray={s.d ? s.d.map((v) => (v * lw).toFixed(1)).join(' ') : undefined}
          strokeLinecap="round"
        />
      );
    }
    case 'mark': {
      const x = sx(s.x);
      const y = sy(s.y);
      const r = Math.max(2.5, s.s * 0.62);
      if (s.m === 'o') return <circle key={key} cx={x} cy={y} r={r} fill={s.c} fillOpacity={s.a} stroke={s.e} strokeWidth={1.2} />;
      if (s.m === 'x')
        return (
          <g key={key} stroke={s.c} strokeWidth={1.8}>
            <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
            <line x1={x - r} y1={y + r} x2={x + r} y2={y - r} />
          </g>
        );
      const d = s.m === '^' ? `M${x},${y - r} L${x + r},${y + r * 0.8} L${x - r},${y + r * 0.8} Z` : `M${x},${y + r} L${x + r},${y - r * 0.8} L${x - r},${y - r * 0.8} Z`;
      return <path key={key} d={d} fill={s.c} fillOpacity={s.a} stroke={s.e} strokeWidth={0.6} />;
    }
    case 'rect': {
      const x1 = sx(s.x);
      const x2 = sx(s.x + s.w);
      const yt = sy(s.y + s.h);
      const yb = sy(s.y);
      return (
        <rect
          key={key}
          x={Math.min(x1, x2)}
          y={Math.min(yt, yb)}
          width={Math.abs(x2 - x1)}
          height={Math.max(0.5, Math.abs(yb - yt))}
          fill={s.f || 'none'}
          fillOpacity={s.f ? s.fa : 0}
          stroke={s.e || 'none'}
          strokeWidth={s.e ? Math.max(0.8, s.ew) : 0}
        />
      );
    }
    case 'poly':
      return (
        <path
          key={key}
          d={s.p.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ') + ' Z'}
          fill={s.f}
          fillOpacity={s.fa}
        />
      );
  }
}
