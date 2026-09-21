import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ACCENT, BORDER, DIM, FG, MONO, label, pill } from './theme';
import { fmtDay, niceTicks, type Layer, type Scene, type ScenePanel } from './scene';
import { DNC, GRID, PAD, PANEL_BG, UPC, placeLabels, shapeNode, tickDigits, yRange } from './chartDraw';

/**
 * Живой график терминала. Рисует ровно то, что нарисовала рисовалка бота, — теми же
 * цветами и штрихами, только с наведением, приближением и слоями. Ничего не считает:
 * все фигуры пришли готовыми в координатах «номер свечи · цена».
 *
 * 21.09.2026, его отзыв с телефона: «как-то он стрёмно смотрится». На узком экране
 * график почти квадратный, номера не наезжают, цены без лишних нулей, служебная
 * строка сверху убрана, подписи под графиком — под кнопкой, есть «на весь экран».
 */

// служебные строки картинки бота (время расчёта, «csv 110») — ученику ни к чему
const TECH = /^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}|\bcsv\s+\d|\bmt5\s+\d/i;

export default function LiveChart({ scene, hidden }: { scene: Scene; hidden: Set<Layer> }) {
  const texts = scene.texts.filter((t) => !TECH.test(t.t));
  return (
    <div>
      {scene.title || texts.length ? (
        <div style={{ marginBottom: 4 }}>
          {scene.title ? <div style={{ color: FG, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{scene.title}</div> : null}
          {texts.map((t, i) => (
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

function PanelChart({ p, hidden }: { p: ScenePanel; hidden: Set<Layer> }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [fs, setFs] = useState(false);
  const [more, setMore] = useState(false);
  const [w, setW] = useState(720);
  const [vh, setVh] = useState(typeof window === 'undefined' ? 800 : window.innerHeight);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => setW(Math.max(260, Math.round(el.clientWidth)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fs]);
  useEffect(() => {
    const f = () => setVh(window.innerHeight);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  // на весь экран — страницу под графиком не листаем
  useEffect(() => {
    if (!fs) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = was;
    };
  }, [fs]);
  const touch = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches, []);

  const narrow = w < 560;
  const H = fs
    ? Math.max(280, vh - 130)
    : Math.round(narrow ? Math.max(290, Math.min(560, w * 0.98)) : Math.max(250, Math.min(520, w * 0.56)));
  const pw = Math.max(50, w - PAD.l - PAD.r);
  const ph = H - PAD.t - PAD.b;
  const R = narrow ? 7.5 : 8.5;

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
    const priceTicks = niceTicks(y0, y1, Math.max(3, Math.round(ph / 60)));
    const dec = tickDigits(priceTicks.length > 1 ? priceTicks[1] - priceTicks[0] : 0, p.dg);
    const inView = p.bars.map((b, i) => ({ b, x: p.x0 + i })).filter(({ x }) => x >= view[0] - 1 && x <= view[1] + 1);
    // подпись недели длиннее (дд.мм.гг) — на неё места больше, иначе даты стоят вплотную
    const step = Math.max(1, Math.ceil(inView.length / Math.max(3, Math.floor(pw / (p.tf === 'W1' ? 120 : 90)))));
    return (
      <g>
        <rect x={PAD.l} y={PAD.t} width={pw} height={ph} fill={PANEL_BG} />
        {priceTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={PAD.l + pw} y1={sy(v)} y2={sy(v)} stroke={GRID} strokeWidth={0.6} />
            <text x={PAD.l + pw + 6} y={sy(v) + 3.5} fontSize={10} fill="#6b7684" fontFamily={MONO}>
              {v.toFixed(dec)}
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

  const placed = useMemo(
    () => placeLabels(p.labels, sx, sy, { x0: PAD.l, x1: PAD.l + pw, y0: PAD.t, y1: PAD.t + ph }, R),
    [p.labels, sx, sy, pw, ph, R],
  );

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
    // 21.09.2026, его просьба: дата свечи под перекрестием — внизу, на оси дат, как цена справа.
    // Дневка и неделя — только дата, время не нужно.
    const day = bar ? bar[0].split('-').reverse().join('.') : null;
    const dayTxt = day ? (p.tf === 'W1' ? `неделя с ${day}` : day) : null;
    const dw = dayTxt ? dayTxt.length * 6.2 + 12 : 0;
    const dx = Math.min(Math.max(sx(xi), PAD.l + dw / 2), PAD.l + pw - dw / 2);
    crossNode = (
      <g pointerEvents="none">
        <line x1={sx(xi)} x2={sx(xi)} y1={PAD.t} y2={PAD.t + ph} stroke="#8b949e" strokeDasharray="3 3" strokeWidth={0.8} />
        <line x1={PAD.l} x2={PAD.l + pw} y1={cross.py} y2={cross.py} stroke="#8b949e" strokeDasharray="3 3" strokeWidth={0.8} />
        <rect x={PAD.l + pw + 1} y={cross.py - 9} width={PAD.r - 2} height={18} rx={3} fill="#2a3038" />
        <text x={PAD.l + pw + 4} y={cross.py + 4} fontSize={10} fill={FG} fontFamily={MONO}>
          {yv.toFixed(p.dg)}
        </text>
        {dayTxt ? (
          <>
            <rect x={dx - dw / 2} y={PAD.t + ph + 3} width={dw} height={18} rx={3} fill="#2a3038" />
            <text x={dx} y={PAD.t + ph + 15.5} fontSize={10} fill={FG} textAnchor="middle" fontFamily={MONO}>
              {dayTxt}
            </text>
          </>
        ) : null}
      </g>
    );
    if (bar) {
      const [d, o, h, l, c] = bar;
      const [yy, mm, dd] = d.split('-');
      tip = (
        <div style={{ position: 'absolute', left: PAD.l + 6, top: PAD.t + 6, right: PAD.r + 6, pointerEvents: 'none', background: 'rgba(12,14,18,0.9)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 8px', fontFamily: MONO, fontSize: 11, color: FG, lineHeight: 1.5 }}>
          {p.tf === 'W1' ? 'неделя с ' : ''}
          {dd}.{mm}.{yy} · откр {o.toFixed(p.dg)} · макс {h.toFixed(p.dg)} · мин {l.toFixed(p.dg)} · закр{' '}
          <span style={{ color: c >= o ? UPC : DNC }}>{c.toFixed(p.dg)}</span>
        </div>
      );
    }
  }

  const hlLabel = hl != null ? placed.find((l) => l.n === hl) : undefined;
  const btn = { ...pill(false), padding: '4px 10px' };

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: FG, fontWeight: 700, fontSize: 14 }}>{p.title}</div>
        {p.note ? <div style={{ color: '#e8b830', fontSize: 12 }}>{p.note}</div> : null}
        {fs ? (
          <button onClick={() => setFs(false)} style={{ ...btn, marginLeft: 'auto' }}>
            ✕ свернуть
          </button>
        ) : null}
      </div>
      {p.head.map((h, i) => (
        <div key={i} style={{ color: h.c, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
          {h.t}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0 8px' }}>
        <button onClick={() => zoomAt(0.7)} style={btn} aria-label="приблизить">
          +
        </button>
        <button onClick={() => zoomAt(1 / 0.7)} style={btn} aria-label="отдалить">
          −
        </button>
        <button onClick={() => setView(full)} style={btn} aria-label="весь график">
          {narrow ? '↺' : 'весь график'}
        </button>
        {!fs ? (
          <button onClick={() => setFs(true)} style={btn} aria-label="на весь экран">
            ⤢ на весь экран
          </button>
        ) : null}
        {!narrow || fs ? (
          <span style={{ ...label, marginLeft: 'auto' }}>
            {touch ? 'два пальца — масштаб · тяните — сдвиг' : 'тяните — сдвиг · Ctrl+колесо — масштаб · двойной щелчок — сброс'}
          </span>
        ) : null}
      </div>
      <div ref={boxRef} style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          width={w}
          height={H}
          style={{ display: 'block', touchAction: 'pan-y', userSelect: 'none', cursor: 'crosshair' }}
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
          <g>
            {placed.map((l) => {
              const on = hl === l.n;
              return (
                <g key={l.n} onPointerEnter={() => setHl(l.n)} onPointerLeave={() => setHl(null)} style={{ cursor: 'pointer' }}>
                  {l.moved ? <line x1={l.ax} y1={l.ay} x2={l.px} y2={l.py} stroke={l.c} strokeOpacity={0.45} strokeWidth={0.8} /> : null}
                  <circle cx={l.px} cy={l.py} r={on ? R + 2.5 : R} fill={PANEL_BG} stroke={l.c} strokeWidth={on ? 2 : 1.2} />
                  <text x={l.px} y={l.py + 3.3} textAnchor="middle" fontSize={on ? 11 : narrow ? 9 : 9.5} fontWeight={700} fill={l.c} fontFamily={MONO}>
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
              left: Math.min(Math.max(hlLabel.px + 14, 4), Math.max(4, w - 230)),
              top: Math.min(Math.max(hlLabel.py - 12, 4), H - 40),
              maxWidth: 240,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2px 14px', marginTop: 10 }}>
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
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setMore(!more)} style={{ ...btn, fontSize: 9 }}>
            {more ? 'скрыть подробности цикла' : 'подробности цикла: запас хода, все переходы угла'}
          </button>
          {more ? (
            <div style={{ whiteSpace: 'pre-wrap', color: DIM, fontSize: 11, fontFamily: MONO, lineHeight: 1.6, marginTop: 8 }}>{p.foot}</div>
          ) : null}
        </div>
      ) : null}
      {hidden.size ? <div style={{ ...label, marginTop: 6, color: ACCENT }}>часть слоёв скрыта</div> : null}
    </>
  );

  if (fs) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#0c0e12', overflowY: 'auto', padding: '12px 10px 24px' }}>
        {content}
      </div>
    );
  }
  return <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 12 }}>{content}</div>;
}
