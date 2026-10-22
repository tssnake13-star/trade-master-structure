import { useEffect, useMemo, useRef } from 'react';

/**
 * Живое окно терминала в блоке «03 · Неделя по системе».
 * 22.10.2026, Сергей: «теперь давай блок про терминал ECHO-GATE INSIDE» — после живого
 * первого экрана. По кругу (17 с) проигрывается вся неделя подписчика, и три карточки
 * под окном подсвечиваются в такт (onPhase):
 *   1. терминал находит выход из накопления → «Допуск», вердикт приходит в Telegram;
 *   2. курсор ставит точку входа и нажимает СТАРТ;
 *   3. советник ставит стоп и тейк, цена идёт, стоп переезжает в безубыток, тейк.
 *
 * ⚠️ 60 кадров: график — статичная SVG, всё, что движется (шторка будущего, линии, точка
 * цены, курсор, карточки), — отдельные слои, у которых меняются только transform и opacity.
 * ⚠️ Без цен, процентов и индикаторов: только свечи, зона, уровни (Сергей 21.10.2026).
 */

const CYCLE = 17000;
const N = 60;
const SIGNAL = 38; // свеча выхода из накопления
const ENTRY = 41; // свеча, на которой ставится точка входа
const VB = { w: 600, h: 300, pad: 14 };

type C = { o: number; h: number; l: number; c: number };

function makeSeries(): C[] {
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = () => (rnd() + rnd() + rnd() - 1.5) * 1.1;
  const out: C[] = [];
  let p = 22;
  for (let i = 0; i < N; i++) {
    let c: number;
    if (i < 18) c = p - 0.55 + g() * 0.8; // спуск
    else if (i < SIGNAL) c = p + (12.5 - p) * 0.3 + g() * 0.75; // накопление
    else if (i === SIGNAL) c = p + 2.6; // выход
    else if (i < ENTRY) c = p - 0.5 + g() * 0.3; // откат к краю зоны
    else if (i < 49) c = p + 0.75 + g() * 0.45; // движение
    else if (i < 52) c = p - 0.6 + g() * 0.3; // откат
    else c = p + 0.8 + g() * 0.4;
    const w = 0.3 + rnd() * 0.6;
    out.push({ o: p, c, h: Math.max(p, c) + w * rnd(), l: Math.min(p, c) - w * rnd() });
    p = c;
  }
  return out;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

export default function TerminalDemo({ onPhase }: { onPhase?: (phase: number, progress: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const series = useMemo(makeSeries, []);

  // геометрия графика в координатах SVG
  const geo = useMemo(() => {
    const lo = Math.min(...series.map((k) => k.l)) - 1;
    const hi = Math.max(...series.map((k) => k.h)) + 1;
    const slot = (VB.w - VB.pad * 2) / N;
    const x = (i: number) => VB.pad + slot * (i + 0.5);
    const y = (v: number) => VB.pad + ((hi - v) / (hi - lo)) * (VB.h - VB.pad * 2);
    const acc = series.slice(18, SIGNAL);
    const zoneTop = Math.max(...acc.map((k) => k.h));
    const zoneBot = Math.min(...acc.map((k) => k.l));
    const entry = zoneTop + 0.2;
    const stop = zoneBot - 0.4;
    const take = entry + (entry - stop) * 2.6;
    return { x, y, slot, zoneTop, zoneBot, entry, stop, take };
  }, [series]);

  // свечи рисуются один раз
  const candles = useMemo(() => {
    let up = '', down = '', wu = '', wd = '';
    series.forEach((k, i) => {
      const cx = geo.x(i), bw = geo.slot * 0.32;
      const top = geo.y(Math.max(k.o, k.c)), bot = Math.max(geo.y(Math.min(k.o, k.c)), top + 1);
      const body = `M${(cx - bw).toFixed(1)} ${top.toFixed(1)}h${(bw * 2).toFixed(1)}V${bot.toFixed(1)}h${(-bw * 2).toFixed(1)}Z`;
      const wick = `M${cx.toFixed(1)} ${geo.y(k.h).toFixed(1)}V${geo.y(k.l).toFixed(1)}`;
      if (k.c >= k.o) { up += body; wu += wick; } else { down += body; wd += wick; }
    });
    return { up, down, wu, wd };
  }, [series, geo]);

  const pct = (vx: number, vy: number) => ({ left: `${(vx / VB.w) * 100}%`, top: `${(vy / VB.h) * 100}%` });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const $ = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    const chart = $('[data-chart]');
    const curtain = $('[data-curtain]');
    const zone = $('[data-zone]');
    const pill = $('[data-pill]');
    const entryL = $('[data-entry]');
    const stopL = $('[data-stop]');
    const takeL = $('[data-take]');
    const beTag = $('[data-be]');
    const takeTag = $('[data-taketag]');
    const dot = $('[data-dot]');
    const cursor = $('[data-cursor]');
    const toast = $('[data-toast]');
    const btn = $('[data-start]');
    const ripple = $('[data-ripple]');
    const btnText = $('[data-start-text]');
    const sentinel = $('[data-sentinel]');

    // размеры и положения считаются только при смене размера, не в каждом кадре
    let W = 0, H = 0, ox = 0, oy = 0, bx = 0, by = 0;
    const measure = () => {
      W = chart.clientWidth; H = chart.clientHeight;
      const r = el.getBoundingClientRect(), c = chart.getBoundingClientRect(), b = btn.getBoundingClientRect();
      ox = c.left - r.left; oy = c.top - r.top;
      bx = b.left - r.left + b.width * 0.5; by = b.top - r.top + b.height * 0.55;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(chart);

    const px = (vx: number) => (vx / VB.w) * W;
    const py = (vy: number) => (vy / VB.h) * H;
    let fade = 1;
    const show = (e: HTMLElement, a: number, dy = 0) => {
      e.style.opacity = (a * fade).toFixed(3);
      e.style.transform = `translate3d(0, ${(dy * (1 - a)).toFixed(1)}px, 0)`;
    };

    const render = (ms: number) => {
      const t = ms / 1000;
      fade = 1 - seg(t, 16.2, 16.9); // в конце круга всё гаснет и начинается заново
      // какая свеча сейчас последняя видимая: до входа рынок стоит у сигнала, потом сделка идёт
      const live = t < 9.5 ? SIGNAL + 2.6 + seg(t, 6, 9) * 0.4 : ENTRY + 1 + ease(seg(t, 9.5, 15)) * (N - ENTRY - 1);
      curtain.style.transform = `translate3d(${px(geo.x(live) - geo.slot * 0.5).toFixed(1)}px, 0, 0)`;

      // 1. зона и допуск
      show(zone, ease(seg(t, 0.6, 1.8)));
      show(pill, ease(seg(t, 1.6, 2.2)), 8);
      show(toast, ease(seg(t, 2.6, 3.4)), 16);

      // 2. точка входа и СТАРТ: курсор идёт к графику, ставит вход, потом жмёт СТАРТ
      const cIn = ease(seg(t, 4.6, 5.2));
      const toEntry = ease(seg(t, 5, 6.2));
      const toBtn = ease(seg(t, 7, 8.2));
      const ex = ox + px(geo.x(ENTRY) - 6), ey = oy + py(geo.y(geo.entry));
      const sx = ox + W * 0.62, sy = oy + H * 0.95;
      const cxp = sx + (ex - sx) * toEntry + (bx - ex) * toBtn;
      const cyp = sy + (ey - sy) * toEntry + (by - ey) * toBtn;
      const press = seg(t, 6.2, 6.5) > 0 && t < 6.6 ? 0.85 : seg(t, 8.3, 8.6) > 0 && t < 8.7 ? 0.85 : 1;
      cursor.style.opacity = (cIn * (1 - seg(t, 9, 9.6)) * fade).toFixed(3);
      cursor.style.transform = `translate3d(${cxp.toFixed(1)}px, ${cyp.toFixed(1)}px, 0) scale(${press})`;
      show(entryL, ease(seg(t, 6.3, 6.8)));
      const started = t >= 8.4;
      btn.dataset.on = started ? '1' : '0';
      btnText.textContent = started ? 'Сделку ведёт советник' : 'СТАРТ';
      const rp = seg(t, 8.4, 9.2);
      ripple.style.opacity = (rp > 0 && rp < 1 ? 1 - rp : 0).toFixed(3);
      btn.style.opacity = (0.35 + 0.65 * fade).toFixed(3);
      ripple.style.transform = `scale(${(0.2 + rp * 1.6).toFixed(3)})`;

      // 3. исполнение: стоп и тейк, безубыток, тейк
      show(stopL, ease(seg(t, 9.1, 9.7)));
      show(takeL, ease(seg(t, 9.1, 9.7)));
      show(sentinel, ease(seg(t, 9.6, 10.3)), 10);
      const be = ease(seg(t, 12, 12.8));
      stopL.style.transform = `translate3d(0, ${(py(geo.y(geo.entry)) - py(geo.y(geo.stop))) * be}px, 0)`;
      show(beTag, ease(seg(t, 12.6, 13.1)));
      const hit = ease(seg(t, 14.6, 15.1));
      show(takeTag, hit);
      takeL.dataset.hit = t > 14.6 ? '1' : '0';

      // точка цены — на закрытии последней видимой свечи
      const i0 = Math.min(N - 1, Math.floor(live - 0.5)), f = Math.max(0, Math.min(1, live - 0.5 - i0));
      const k = series[i0], kn = series[Math.min(N - 1, i0 + 1)];
      const price = k.c + (kn.c - k.c) * f;
      dot.style.transform = `translate3d(${px(geo.x(live - 0.5)).toFixed(1)}px, ${py(geo.y(price)).toFixed(1)}px, 0)`;
      dot.style.opacity = fade.toFixed(3);

      const phase = t < 4.6 ? 0 : t < 9 ? 1 : 2;
      const from = [0, 4.6, 9][phase], to = [4.6, 9, 16.4][phase];
      if (onPhase) onPhase(phase, seg(t, from, to));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(15500);
      return () => ro.disconnect();
    }

    let visible = false;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.15 });
    io.observe(el);
    let raf = 0, t0 = performance.now(), paused = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) { paused = paused || now; return; }
      if (paused) { t0 += now - paused; paused = 0; }
      render((now - t0) % CYCLE);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [geo, series, onPhase]);

  const zoneStyle = {
    ...pct(geo.x(18) - geo.slot / 2, geo.y(geo.zoneTop)),
    width: `${((geo.x(SIGNAL) - geo.x(18)) / VB.w) * 100}%`,
    height: `${((geo.y(geo.zoneBot) - geo.y(geo.zoneTop)) / VB.h) * 100}%`,
  };
  const lineAt = (v: number, from: number) => ({ left: `${(geo.x(from) / VB.w) * 100}%`, right: '2%', top: `${(geo.y(v) / VB.h) * 100}%` });

  return (
    <div ref={root} className="td" aria-hidden="true">
      <div className="td-win">
        <div className="td-bar">
          <span className="td-dots"><i /><i /><i /></span>
          <span className="td-title">ECHO-GATE INSIDE · EURUSD · D1</span>
          <span className="td-live"><span className="td-live-dot" /> live</span>
        </div>
        <div className="td-body">
          <div className="td-chart" data-chart>
            <svg viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="none" className="td-svg">
              {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={VB.w} y1={VB.h * g} y2={VB.h * g} className="td-grid" />)}
              <path d={candles.wu} className="td-wick-up" />
              <path d={candles.wd} className="td-wick-down" />
              <path d={candles.up} className="td-up" />
              <path d={candles.down} className="td-down" />
            </svg>
            <div className="td-zone" data-zone style={zoneStyle}><span>накопление</span></div>
            <div className="td-line td-line--take" data-take style={lineAt(geo.take, SIGNAL)}><span>тейк</span></div>
            <div className="td-line td-line--entry" data-entry style={lineAt(geo.entry, ENTRY - 1)}><span>вход</span></div>
            <div className="td-line td-line--stop" data-stop style={lineAt(geo.stop, SIGNAL)}><span>стоп</span></div>
            <div className="td-tag td-tag--be" data-be style={{ ...pct(geo.x(N - 12), geo.y(geo.entry)) }}>безубыток</div>
            <div className="td-tag td-tag--take" data-taketag style={{ ...pct(geo.x(N - 9), geo.y(geo.take)) }}>тейк взят</div>
            <div className="td-curtain" data-curtain />
            <div className="td-dot" data-dot />
            {/* метка встаёт слева от свечи выхода: справа на телефоне ей не хватает места */}
            <div className="td-pill" data-pill style={{ right: `${((VB.w - geo.x(SIGNAL) + 14) / VB.w) * 100}%`, top: `${((geo.y(geo.zoneTop) - 72) / VB.h) * 100}%` }}>
              <span className="td-pill-dot" /> Допуск · покупка
            </div>
          </div>

          <div className="td-side">
            <div className="td-toast" data-toast>
              <div className="td-toast-head">Telegram · Сергей Тё</div>
              <div className="td-toast-body">Вердикт: допуск подтверждаю. Точку входа — по уроку.</div>
            </div>
            <div className="td-start" data-start data-on="0">
              <span className="td-ripple" data-ripple />
              <span data-start-text>СТАРТ</span>
            </div>
            <div className="td-sentinel" data-sentinel>
              <span className="td-check">✓</span> Risk Sentinel · лимиты риска в норме
            </div>
          </div>
        </div>
      </div>
      <svg className="td-cursor" data-cursor viewBox="0 0 24 24" width="22" height="22">
        <path d="M4 2l15 9.5-6.6 1.4 3.9 7.3-2.6 1.4-3.9-7.3L4 19z" fill="#fff" stroke="#111" strokeWidth="1.2" />
      </svg>
    </div>
  );
}
