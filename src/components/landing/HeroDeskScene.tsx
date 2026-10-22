import { useEffect, useRef } from 'react';
import deskImg from '@/assets/hero-desk.jpg';
import { LiveScreen, type LiveEvent, type Pt } from './heroDeskLive';

/**
 * Сцена первого экрана: рабочее место трейдера, которое оживает.
 * 21.10.2026, Сергей по образцу (сайт барбершопа, где кресло и машинки «живут»):
 * «хочу добавить вот такую анимацию… по теме трейдинга». Проба утверждена: «да, ставь на сайт».
 *
 * Вступление идёт само, медленно (8 с): в комнате загорается свет, мониторы плавно
 * включаются, камера отъезжает, за мониторами прорисовывается золотое кольцо.
 * Дальше сцена живёт без конца (22.10.2026, «эффекта вау нету… постоянно что-то происходило»):
 *   · на мониторах идут свечи, цена выходит из накопления, терминал отмечает зону и уровень;
 *   · всплывает карточка «Допуск» или «Отказ»;
 *   · по кольцу бежит блик, свечение дышит, в свете поднимается пыль;
 *   · на компьютере сцена слегка идёт за мышью: кольцо и пыль сильнее стола — глубина.
 *
 * ⚠️ Устройство под 60 кадров (Сергей 22.10.2026: «тормозит страшно… 60 кадров в секунду
 * должно»). Прежний вариант был одной SVG с размытием, которую браузер перерисовывал целиком
 * каждый кадр. Теперь:
 *   · фото, затемнения и кромка мониторов — отдельные слои, у которых меняются только
 *     прозрачность и сдвиг: это делает видеокарта без перерисовки;
 *   · свечи — canvas за затемнениями; кольцо, блик, дымка и пыль — canvas спереди;
 *   · свечение кольца, блик и пылинки нарисованы один раз заранее (спрайты), в кадре их
 *     только поворачивают и двигают. Фильтры размытия в анимации не участвуют.
 * ⚠️ На экранах только свечи, уровни и зоны — без индикаторов (Сергей 21.10.2026).
 */

const LEFT = '689,205 1172,200 1172,470 691,470';
const RIGHT = '1180,200 1636,163 1633,537 1180,475';
const LEFT_Q: [Pt, Pt, Pt, Pt] = [[689, 205], [1172, 200], [1172, 470], [691, 470]];
const RIGHT_Q: [Pt, Pt, Pt, Pt] = [[1180, 200], [1636, 163], [1633, 537], [1180, 475]];
const RING = { x: 1270, y: 300, r: 292 };
const INTRO_MS = 8000;

// инструменты в карточках — только то, что Сергей разбирает (нефть он не торгует)
const SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPJPY', 'BTCUSD', 'USDCAD', 'AUDJPY', 'ETHUSD', 'GBPUSD'];

// пылинки в свете лампы и кольца: x, y, радиус, скорость подъёма, фаза
const DUST = Array.from({ length: 26 }, (_, i) => {
  const r = (k: number) => (((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1) + 1) % 1;
  return { x: 880 + r(1) * 780, y: 40 + r(2) * 560, s: 0.9 + r(3) * 1.9, v: 6 + r(4) * 14, ph: r(5) * 6.28 };
});

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

type Props = {
  /** 'wide' — сцена целиком справа от текста; 'narrow' — только мониторы и стол (полоса на телефоне) */
  variant: 'wide' | 'narrow';
  className?: string;
};

// телефон: в кадре только мониторы и стол, во всю ширину полосы.
// Компьютер: сцена вписывается целиком в правую половину, чтобы мониторы не заходили под текст.
const VIEW = {
  narrow: { vb: [640, 90, 1032, 800], slice: true, ax: 0.5, attr: 'xMidYMid slice' },
  wide: { vb: [650, 0, 1022, 941], slice: false, ax: 1, attr: 'xMaxYMid meet' },
} as const;

/** то же, что делает SVG с viewBox и preserveAspectRatio: масштаб и сдвиг картинки в пикселях */
function fit(variant: 'wide' | 'narrow', W: number, H: number) {
  const v = VIEW[variant];
  const [vx, vy, vw, vh] = v.vb;
  const k = v.slice ? Math.max(W / vw, H / vh) : Math.min(W / vw, H / vh);
  return { k, tx: (W - vw * k) * v.ax - vx * k, ty: (H - vh * k) * 0.5 - vy * k };
}

function sprite(size: number, draw: (c: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.max(2, Math.ceil(size));
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx);
  return c;
}

export default function HeroDeskScene({ variant, className }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(s: string) => el.querySelector(s) as T;
    const zoom = q<HTMLDivElement>('[data-zoom]');
    const back = q<HTMLDivElement>('[data-back]');
    const chartsCv = q<HTMLCanvasElement>('[data-charts]');
    const fxCv = q<HTMLCanvasElement>('[data-fx]');
    const off = q<SVGSVGElement>('[data-off]');
    const dark = q<SVGSVGElement>('[data-dark]');
    const dark2 = q<HTMLDivElement>('[data-dark2]');
    const rim = q<SVGSVGElement>('[data-rim]');
    const card = q<HTMLDivElement>('[data-card]');
    const cx = chartsCv.getContext('2d');
    const fx = fxCv.getContext('2d');
    if (!cx || !fx) return;

    let screensOn = 0;
    let ringOn = 0;
    const render = (p: number) => {
      const light = ease(seg(p, 0.02, 0.3));
      dark2.style.opacity = (0.78 * (1 - light)).toFixed(3);
      dark.style.opacity = (1 - 0.75 * light).toFixed(3);
      rim.style.opacity = (1 - ease(seg(p, 0.18, 0.42))).toFixed(3);
      screensOn = ease(seg(p, 0.3, 0.58));
      off.style.opacity = (1 - screensOn).toFixed(3);
      ringOn = ease(seg(p, 0.6, 0.97));
      zoom.style.transform = `scale(${(1.14 - 0.14 * ease(p)).toFixed(4)})`;
    };

    // размеры холстов и спрайты: пересчитываются при смене размера блока
    let W = 0, H = 0, dpr = 1;
    let F = fit(variant, 1, 1);
    let ringSpr: HTMLCanvasElement | null = null;
    let cometSpr: HTMLCanvasElement | null = null;
    let hazeSpr: HTMLCanvasElement | null = null;
    let dotSpr: HTMLCanvasElement | null = null;
    const ringPad = 60;
    const layout = () => {
      W = el.clientWidth; H = el.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const c of [chartsCv, fxCv]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      F = fit(variant, W, H);
      zoom.style.transformOrigin = `${(F.tx + 1240 * F.k).toFixed(1)}px ${(F.ty + 400 * F.k).toFixed(1)}px`;
      // кольцо, блик и дымка — один раз, в пикселях экрана
      const s = F.k * dpr;
      const size = (RING.r + ringPad) * 2 * s;
      const c0 = size / 2;
      const glowRing = (c: CanvasRenderingContext2D, color: string, width: number, from: number, to: number) => {
        c.lineCap = 'round';
        for (const [blur, alpha, w] of [[40, 0.5, width * 2.2], [16, 0.8, width * 1.3], [0, 1, width]] as const) {
          c.save();
          c.globalAlpha = alpha;
          c.shadowColor = color; c.shadowBlur = blur * s;
          c.strokeStyle = color; c.lineWidth = w * s;
          c.beginPath(); c.arc(c0, c0, RING.r * s, from, to); c.stroke();
          c.restore();
        }
      };
      ringSpr = sprite(size, (c) => glowRing(c, '#ffcf7a', 7, 0, Math.PI * 2));
      cometSpr = sprite(size, (c) => glowRing(c, '#fff3d6', 9, -Math.PI / 2, -Math.PI / 2 + 140 / RING.r));
      hazeSpr = sprite(920 * s, (c) => {
        const h = 460 * s;
        const g = c.createRadialGradient(h, h, 0, h, h, h);
        g.addColorStop(0, 'rgba(243,177,79,0.30)'); g.addColorStop(0.6, 'rgba(200,134,47,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(0, 0, h * 2, h * 2);
      });
      dotSpr = sprite(24 * dpr, (c) => {
        const h = 12 * dpr;
        const g = c.createRadialGradient(h, h, 0, h, h, h);
        g.addColorStop(0, 'rgba(255,220,166,1)'); g.addColorStop(0.35, 'rgba(255,220,166,0.55)'); g.addColorStop(1, 'rgba(255,220,166,0)');
        c.fillStyle = g; c.fillRect(0, 0, h * 2, h * 2);
      });
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    // кольцо видно только выше верхнего края мониторов (вместе с рамкой): ниже оно «за ними».
    // Одна фигура без дыр — прежняя маска из перекрывающихся фигур (evenodd) пропускала кольцо
    // там, где фигуры накладывались: под левым монитором и в щели между мониторами
    // (Сергей 22.10.2026, на планшете: «задевает край монитора… наезжает на монитор»).
    const behind = new Path2D();
    // слева и справа от мониторов — стена, там свечению можно опускаться ниже
    behind.moveTo(-400, -400); behind.lineTo(2100, -400); behind.lineTo(2100, 600); behind.lineTo(1652, 600);
    behind.lineTo(1652, 150); behind.lineTo(1176, 189); behind.lineTo(682, 194); behind.lineTo(678, 600); behind.lineTo(-400, 600);
    behind.closePath();

    // карточка терминала: одна за раз, не чаще раза в 6 с
    let cardN = 0;
    let cardAt = -1e9;
    let cardTimer = 0;
    const setText = (sel: string, text: string) => { (card.querySelector(sel) as HTMLElement).textContent = text; };
    const onEvent = (e: LiveEvent) => {
      const now = performance.now();
      if (screensOn < 0.95 || now - cardAt < 6000) return;
      cardAt = now;
      const sym = SYMBOLS[cardN++ % SYMBOLS.length];
      card.dataset.kind = e.ok ? 'ok' : 'no';
      setText('[data-c-title]', e.ok ? 'Допуск' : 'Отказ');
      setText('[data-c-body]', e.ok
        ? `${sym} · ${e.dir > 0 ? 'покупка' : 'продажа'} · выход из накопления`
        : `${sym} · выход ложный, сделки нет`);
      setText('[data-c-foot]', e.ok ? 'вердикт — в Telegram' : 'система сказала «нет»');
      card.classList.add('is-on');
      window.clearTimeout(cardTimer);
      cardTimer = window.setTimeout(() => card.classList.remove('is-on'), 4600);
    };

    const screens = [
      new LiveScreen(LEFT_Q, 46, 1700, 7, onEvent),
      new LiveScreen(RIGHT_Q, 64, 1300, 21, onEvent),
    ];

    const drawCharts = (now: number, dt: number) => {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, chartsCv.width, chartsCv.height);
      if (screensOn <= 0) return;
      cx.setTransform(F.k * dpr, 0, 0, F.k * dpr, F.tx * dpr, F.ty * dpr);
      for (const sc of screens) sc.draw(cx, now, dt);
    };

    // ox, oy — насколько слой с кольцом сдвинут за мышью сильнее стола (в единицах картинки):
    // граница «за монитором» должна стоять на мониторе, а не ехать вместе с кольцом
    const drawFx = (now: number, ox = 0, oy = 0) => {
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.clearRect(0, 0, fxCv.width, fxCv.height);
      if (!ringSpr || !cometSpr || !hazeSpr || !dotSpr) return;
      const t = now / 1000;
      fx.setTransform(F.k * dpr, 0, 0, F.k * dpr, F.tx * dpr, F.ty * dpr);
      if (ringOn > 0) {
        fx.save();
        fx.translate(-ox, -oy);
        fx.clip(behind);
        fx.translate(ox, oy);
        const box = (RING.r + ringPad) * 2;
        fx.globalAlpha = ringOn * (0.8 + 0.2 * Math.sin(t * 0.7));
        fx.drawImage(hazeSpr, RING.x - 460, RING.y - 460, 920, 920);
        fx.globalAlpha = 1;
        // кольцо прорисовывается по кругу, пока идёт вступление
        if (ringOn < 1) {
          fx.beginPath();
          fx.moveTo(RING.x, RING.y);
          fx.arc(RING.x, RING.y, box, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringOn);
          fx.closePath();
          fx.clip();
        }
        fx.drawImage(ringSpr, RING.x - box / 2, RING.y - box / 2, box, box);
        if (ringOn >= 1) {
          // блик бежит по кольцу: готовую картинку только поворачиваем
          fx.translate(RING.x, RING.y);
          fx.rotate((t * 120) / RING.r);
          fx.globalAlpha = 0.9;
          fx.drawImage(cometSpr, -box / 2, -box / 2, box, box);
        }
        fx.restore();
      }
      // пыль медленно поднимается в свете и мерцает
      const base = Math.max(0.15, screensOn);
      for (const d of DUST) {
        const y = (((d.y - t * d.v) % 600) + 600) % 600 + 20;
        const x = d.x + Math.sin(t * 0.6 + d.ph) * 14;
        fx.globalAlpha = base * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + d.ph)));
        const r = d.s * 2.4;
        fx.drawImage(dotSpr, x - r, y - r, r * 2, r * 2);
      }
      fx.globalAlpha = 1;
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(1);
      const now = performance.now();
      drawCharts(now, 1000);
      drawFx(now);
      return () => { ro.disconnect(); };
    }

    // глубина за курсором (только мышь): стол сдвигается чуть-чуть, кольцо и пыль сильнее
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;
      tx = (ev.clientX / window.innerWidth) * 2 - 1;
      ty = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // за краем экрана и в фоновой вкладке сцена не считается
    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(el);

    const t0 = performance.now() + 700;
    let lastP = -1;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(100, now - last);
      last = now;
      if (!visible || document.hidden || !W) return;
      const p = clamp((now - t0) / INTRO_MS);
      if (p !== lastP) { render(p); lastP = p; }

      const a = 1 - Math.exp(-dt / 500);
      mx += (tx - mx) * a; my += (ty - my) * a;
      drawCharts(now, dt);
      drawFx(now, -mx * 14, -my * 9);
      if (screensOn > 0.95 && now - cardAt > 7000) screens[cardN % 2].nudge();

      back.style.transform = `translate3d(${(-mx * 8 * F.k).toFixed(2)}px, ${(-my * 5 * F.k).toFixed(2)}px, 0)`;
      fxCv.style.transform = `translate3d(${(-mx * 22 * F.k).toFixed(2)}px, ${(-my * 14 * F.k).toFixed(2)}px, 0)`;
    };
    render(0);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(cardTimer);
    };
  }, [variant]);

  const v = VIEW[variant];
  const svgProps = { viewBox: v.vb.join(' '), preserveAspectRatio: v.attr, className: 'hd-layer' };

  return (
    <div ref={root} className={`hd-scene relative overflow-hidden ${className ?? ''}`} aria-hidden="true">
      <div data-zoom className="hd-layer" style={{ transform: 'scale(1.14)' }}>
        <div data-back className="hd-layer">
          <svg {...svgProps}><image href={deskImg} width="1672" height="941" /></svg>
          {/* живые мониторы: свечи, зоны накопления, уровни (heroDeskLive.ts) */}
          <canvas data-charts className="hd-layer" />
          <svg data-off {...svgProps}>
            <polygon points={LEFT} fill="#050506" />
            <polygon points={RIGHT} fill="#050506" />
          </svg>
          <svg data-dark {...svgProps}>
            <defs>
              <radialGradient id={`hd-lamp-${variant}`} cx="66%" cy="58%" r="62%">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset=".55" stopColor="#000" stopOpacity=".35" />
                <stop offset="1" stopColor="#000" stopOpacity="1" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="1672" height="941" fill={`url(#hd-lamp-${variant})`} />
          </svg>
          <div data-dark2 className="hd-layer" style={{ background: '#000', opacity: 0.78 }} />
          <svg data-rim {...svgProps}>
            <defs><filter id={`hd-soft-${variant}`}><feGaussianBlur stdDeviation="2.2" /></filter></defs>
            <g fill="none" stroke="#e9a54a" strokeWidth="2.4" filter={`url(#hd-soft-${variant})`}>
              <polygon points={LEFT} />
              <polygon points={RIGHT} />
            </g>
          </svg>
        </div>
        <canvas data-fx className="hd-layer" />
      </div>

      <div data-card className={`hd-card hd-card--${variant}`}>
        <div className="hd-card__head"><span className="hd-card__dot" />ECHO-GATE INSIDE · <b data-c-title>Допуск</b></div>
        <div className="hd-card__body" data-c-body />
        <div className="hd-card__foot" data-c-foot />
      </div>
    </div>
  );
}
