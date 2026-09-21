import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ACCENT, BORDER, DIM, FG, MONO, label, pill } from './theme';
import { fmtDay, niceTicks, type Layer, type Scene, type ScenePanel, type Shape } from './scene';

/**
 * Живой график терминала. Рисует ровно то, что нарисовала рисовалка бота, — теми же
 * цветами и штрихами, только с наведением, приближением и слоями. Ничего не считает:
 * все фигуры пришли готовыми в координатах «номер свечи · цена».
 */

const PANEL_BG = '#161b22'; // фон поля — как на картинке бота
const GRID = '#2a3038';
const UPC = '#26a17b';
const DNC = '#d1493f';
const PAD = { l: 6, r: 64, t: 10, b: 24 };

export default function LiveChart({ scene, hidden }: { scene: Scene; hidden: Set<Layer> }) {
  return (
    <div>
      {scene.title || scene.texts.length ? (
        <div style={{ marginBottom: 12 }}>
          {scene.title ? <div style={{ color: FG, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{scene.title}</div> : null}
          {scene.texts.map((t, i) => (
            <div key={i} style={{ color: t.c, fontSize: 12, lineHeight: 1.55 }}>
              {t.t}
            </div>
          ))}
        </div>
      ) : null}
      {scene.panels.map((p, i) => (
        <PanelChart key={i} p={p} hidden={hidden} />
      ))}
    </div>
  );
}

/** По высоте: пока смотрим целиком — как на картинке (видна цель цикла); приблизили
 *  больше чем вдвое — подгоняем под видимые свечи, иначе они сплющиваются. */
function yRange(p: ScenePanel, v: [number, number], full: [number, number]): [number, number] {
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

function shapeNode(s: Shape, key: number, sx: (x: number) => number, sy: (y: number) => number): ReactNode {
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

function PanelChart({ p, hidden }: { p: ScenePanel; hidden: Set<Layer> }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(720);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => setW(Math.max(280, Math.round(el.clientWidth)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = Math.round(Math.max(250, Math.min(520, w * 0.56)));
  const pw = Math.max(50, w - PAD.l - PAD.r);
  const ph = H - PAD.t - PAD.b;

  const lastX = p.x0 + p.bars.length - 1;
  const full = useMemo<[number, number]>(() => [p.xlim[0], p.edge ?? p.xlim[1]], [p]);
  const [view, setView] = useState<[number, number]>(full);
  useEffect(() => setView(full), [full]);
  const [hl, setHl] = useState<number | null>(null);
  const [cross, setCross] = useState<{ px: number; py: number } | null>(null);

  const clampView = useCallback(
    (a: number, b: number): [number, number] => {
      const minX = p.x0 - 3;
      const maxX = Math.max(full[1], lastX + 6);
      const s = Math.min(Math.max(b - a, 8), maxX - minX);
      let lo = a;
      if (lo < minX) lo = minX;
      if (lo + s > maxX) lo = maxX - s;
      return [lo, lo + s];
    },
    [p.x0, full, lastX],
  );
  const zoomAt = useCallback(
    (k: number, cx?: number) =>
      setView((v) => {
        const s0 = v[1] - v[0];
        const mx = cx ?? v[0] + s0 / 2;
        const frac = (mx - v[0]) / s0;
        const s = s0 * k;
        return clampView(mx - s * frac, mx + s * (1 - frac));
      }),
    [clampView],
  );

  const [y0, y1] = useMemo(() => yRange(p, view, full), [p, view, full]);
  const span = view[1] - view[0];
  const sx = useCallback((x: number) => PAD.l + ((x - view[0]) / span) * pw, [view, span, pw]);
  const sy = useCallback((y: number) => PAD.t + ((y1 - y) / (y1 - y0)) * ph, [y0, y1, ph]);
  const toDataX = (px: number) => view[0] + ((px - PAD.l) / pw) * span;

  // колесо: только с Ctrl, иначе страница перестаёт листаться, когда мышь над графиком
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(e.deltaY * 0.0015), toDataX(e.clientX - r.left));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  // тянуть — сдвиг, два пальца — масштаб, тап — перекрестие
  const ptrs = useRef(new Map<number, number>());
  const drag = useRef<{ id: number; x: number; v: [number, number]; moved: boolean } | null>(null);
  const pinch = useRef<{ d: number; v: [number, number]; mid: number } | null>(null);
  const local = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  };
  const onDown = (e: React.PointerEvent) => {
    svgRef.current?.setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, e.clientX);
    if (ptrs.current.size === 1) drag.current = { id: e.pointerId, x: e.clientX, v: view, moved: false };
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      const r = svgRef.current!.getBoundingClientRect();
      pinch.current = { d: Math.abs(a - b) || 1, v: view, mid: (a + b) / 2 - r.left };
      drag.current = null;
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, e.clientX);
    if (pinch.current && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()];
      const { d, v, mid } = pinch.current;
      const s0 = v[1] - v[0];
      const mx = v[0] + ((mid - PAD.l) / pw) * s0;
      const s = s0 * (d / (Math.abs(a - b) || 1));
      const frac = (mx - v[0]) / s0;
      setView(clampView(mx - s * frac, mx + s * (1 - frac)));
      return;
    }
    const dr = drag.current;
    if (dr && dr.id === e.pointerId) {
      const dx = e.clientX - dr.x;
      if (Math.abs(dx) > 4) dr.moved = true;
      if (dr.moved) {
        const shift = -(dx / pw) * (dr.v[1] - dr.v[0]);
        setView(clampView(dr.v[0] + shift, dr.v[1] + shift));
        setCross(null);
        return;
      }
    }
    if (e.pointerType === 'mouse') setCross(local(e));
  };
  const onUp = (e: React.PointerEvent) => {
    const dr = drag.current;
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) pinch.current = null;
    if (dr && dr.id === e.pointerId) {
      if (!dr.moved && e.pointerType !== 'mouse') setCross(local(e));
      drag.current = null;
    }
  };

  const sorted = useMemo(() => [...p.shapes].sort((a, b) => a.z - b.z), [p]);
  const cid = useMemo(() => `clip${Math.random().toString(36).slice(2, 9)}`, []);

  // Всё, что не зависит от мыши, собирается один раз на вид — наведение его не перерисовывает.
  const body = useMemo(() => {
    const vis = sorted.filter((s) => !hidden.has(s.L));
    const bw = Math.max(1, Math.min(14, (pw / span) * 0.62));
    const priceTicks = niceTicks(y0, y1, Math.max(3, Math.round(ph / 55)));
    const inView = p.bars.map((b, i) => ({ b, x: p.x0 + i })).filter(({ x }) => x >= view[0] - 1 && x <= view[1] + 1);
    const step = Math.max(1, Math.ceil(inView.length / Math.max(3, Math.floor(pw / 86))));
    const fmtP = (v: number) => v.toFixed(Math.min(p.dg, Math.abs(v) >= 1000 ? 2 : p.dg));
    return (
      <g>
        <rect x={PAD.l} y={PAD.t} width={pw} height={ph} fill={PANEL_BG} />
        {priceTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={PAD.l + pw} y1={sy(v)} y2={sy(v)} stroke={GRID} strokeWidth={0.6} />
            <text x={PAD.l + pw + 6} y={sy(v) + 3.5} fontSize={10} fill="#6b7684" fontFamily={MONO}>
              {fmtP(v)}
            </text>
          </g>
        ))}
        {inView
          .filter(({ x }, i) => i % step === 0 && sx(x) > PAD.l + 22 && sx(x) < PAD.l + pw - 22)
          .map(({ b, x }) => (
            <text key={x} x={sx(x)} y={PAD.t + ph + 16} fontSize={10} fill="#6b7684" textAnchor="middle" fontFamily={MONO}>
              {fmtDay(b[0], p.tf)}
            </text>
          ))}
        <g clipPath={`url(#${cid})`}>
          {vis.filter((s) => s.z < 6).map((s, i) => shapeNode(s, i, sx, sy))}
          {inView.map(({ b, x }) => {
            const col = b[4] >= b[1] ? UPC : DNC;
            const top = sy(Math.max(b[1], b[4]));
            const bot = sy(Math.min(b[1], b[4]));
            return (
              <g key={x}>
                <line x1={sx(x)} x2={sx(x)} y1={sy(b[2])} y2={sy(b[3])} stroke={col} strokeWidth={1} />
                <rect x={sx(x) - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={col} />
              </g>
            );
          })}
          {vis.filter((s) => s.z >= 6).map((s, i) => shapeNode(s, 10000 + i, sx, sy))}
        </g>
      </g>
    );
  }, [sorted, hidden, p, view, span, pw, ph, y0, y1, sx, sy, cid]);

  if (p.empty) {
    return (
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 12 }}>
        <div style={{ color: FG, fontWeight: 700, fontSize: 14 }}>{p.title}</div>
        {p.head.map((h, i) => (
          <div key={i} style={{ color: h.c, fontSize: 13, marginTop: 6 }}>
            {h.t}
          </div>
        ))}
      </div>
    );
  }

  // перекрестие и свеча под ним
  let tip: ReactNode = null;
  let crossNode: ReactNode = null;
  if (cross && cross.px >= PAD.l && cross.px <= PAD.l + pw && cross.py >= PAD.t && cross.py <= PAD.t + ph) {
    const xi = Math.round(toDataX(cross.px));
    const bar = p.bars[xi - p.x0];
    const yv = y1 - ((cross.py - PAD.t) / ph) * (y1 - y0);
    crossNode = (
      <g pointerEvents="none">
        <line x1={sx(xi)} x2={sx(xi)} y1={PAD.t} y2={PAD.t + ph} stroke="#8b949e" strokeDasharray="3 3" strokeWidth={0.8} />
        <line x1={PAD.l} x2={PAD.l + pw} y1={cross.py} y2={cross.py} stroke="#8b949e" strokeDasharray="3 3" strokeWidth={0.8} />
        <rect x={PAD.l + pw + 1} y={cross.py - 9} width={PAD.r - 2} height={18} rx={3} fill="#2a3038" />
        <text x={PAD.l + pw + 5} y={cross.py + 4} fontSize={10} fill={FG} fontFamily={MONO}>
          {yv.toFixed(p.dg)}
        </text>
      </g>
    );
    if (bar) {
      const [d, o, h, l, c] = bar;
      const [yy, mm, dd] = d.split('-');
      tip = (
        <div style={{ position: 'absolute', left: PAD.l + 8, top: PAD.t + 6, pointerEvents: 'none', background: 'rgba(12,14,18,0.88)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 8px', fontFamily: MONO, fontSize: 11, color: FG, whiteSpace: 'nowrap' }}>
          {p.tf === 'W1' ? 'неделя с ' : ''}
          {dd}.{mm}.{yy} · откр {o.toFixed(p.dg)} · макс {h.toFixed(p.dg)} · мин {l.toFixed(p.dg)} · закр{' '}
          <span style={{ color: c >= o ? UPC : DNC }}>{c.toFixed(p.dg)}</span>
        </div>
      );
    }
  }

  const hlLabel = hl != null ? p.labels.find((l) => l.n === hl) : undefined;

  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: FG, fontWeight: 700, fontSize: 14 }}>{p.title}</div>
        {p.note ? <div style={{ color: '#e8b830', fontSize: 12 }}>{p.note}</div> : null}
      </div>
      {p.head.map((h, i) => (
        <div key={i} style={{ color: h.c, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
          {h.t}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0 8px' }}>
        <button onClick={() => zoomAt(0.7)} style={{ ...pill(false), padding: '3px 10px' }} aria-label="приблизить">
          +
        </button>
        <button onClick={() => zoomAt(1 / 0.7)} style={{ ...pill(false), padding: '3px 10px' }} aria-label="отдалить">
          −
        </button>
        <button onClick={() => setView(full)} style={{ ...pill(false), padding: '3px 10px' }}>
          весь график
        </button>
        <span style={{ ...label, marginLeft: 'auto' }}>тяните — сдвиг · Ctrl+колесо или два пальца — масштаб</span>
      </div>
      <div ref={boxRef} style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          width={w}
          height={H}
          style={{ display: 'block', touchAction: 'pan-y', userSelect: 'none', cursor: drag.current?.moved ? 'grabbing' : 'crosshair' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setCross(null)}
          onDoubleClick={() => setView(full)}
        >
          <defs>
            <clipPath id={cid}>
              <rect x={PAD.l} y={PAD.t} width={pw} height={ph} />
            </clipPath>
          </defs>
          {body}
          {crossNode}
          <g clipPath={`url(#${cid})`}>
            {p.labels.map((l) => {
              const on = hl === l.n;
              return (
                <g key={l.n} onPointerEnter={() => setHl(l.n)} onPointerLeave={() => setHl(null)} style={{ cursor: 'pointer' }}>
                  <circle cx={sx(l.x)} cy={sy(l.y)} r={on ? 11 : 8.5} fill={PANEL_BG} stroke={l.c} strokeWidth={on ? 2 : 1.2} />
                  <text x={sx(l.x)} y={sy(l.y) + 3.5} textAnchor="middle" fontSize={on ? 11 : 9.5} fontWeight={700} fill={l.c} fontFamily={MONO}>
                    {l.n}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {tip}
        {hlLabel && hlLabel.t ? (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(sx(hlLabel.x) + 14, 4), w - 240),
              top: Math.min(Math.max(sy(hlLabel.y) - 12, 4), H - 40),
              maxWidth: 260,
              pointerEvents: 'none',
              background: 'rgba(12,14,18,0.92)',
              border: `1px solid ${hlLabel.c}`,
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              color: hlLabel.c,
            }}
          >
            {hlLabel.n} — {hlLabel.t}
          </div>
        ) : null}
      </div>
      {p.labels.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px 14px', marginTop: 10 }}>
          {p.labels.map((l) => (
            <div
              key={l.n}
              onPointerEnter={() => setHl(l.n)}
              onPointerLeave={() => setHl(null)}
              onClick={() => setHl(hl === l.n ? null : l.n)}
              style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12, lineHeight: 1.5, color: l.c, cursor: 'pointer', background: hl === l.n ? '#1d2229' : 'transparent', borderRadius: 4, padding: '1px 4px' }}
            >
              <span style={{ fontFamily: MONO, fontWeight: 700, minWidth: 18 }}>{l.n}</span>
              <span>{l.t}</span>
            </div>
          ))}
        </div>
      ) : null}
      {p.foot ? (
        <div style={{ whiteSpace: 'pre-wrap', color: DIM, fontSize: 11, fontFamily: MONO, lineHeight: 1.6, marginTop: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
          {p.foot}
        </div>
      ) : null}
      {hidden.size ? <div style={{ ...label, marginTop: 6, color: ACCENT }}>часть слоёв скрыта</div> : null}
    </div>
  );
}
