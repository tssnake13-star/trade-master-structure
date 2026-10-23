import { useEffect, useRef } from 'react';
import deskImg from '@/assets/hero-desk-ring.jpg';
import ringLightUrl from '@/assets/hero-ring-light.webp';
import ringOffUrl from '@/assets/hero-ring-off.webp';
import { LiveScreen, makeScreen, type LiveEvent, type ScreenDef } from './heroDeskLive';

/**
 * Сцена первого экрана: рабочее место трейдера, которое оживает.
 * 21.10.2026, Сергей по образцу (сайт барбершопа, где кресло и машинки «живут»):
 * «хочу добавить вот такую анимацию… по теме трейдинга». Проба утверждена: «да, ставь на сайт».
 *
 * 23.10.2026, Сергей: «мониторы должны быть широкоформатного размера, как на исходнике… с кольцом…
 * безрамочные… картинка как будто виртуальная, надо как реальная». Сцена теперь стоит на его кадре
 * с кольцом (4.webp из переписки): кольцо, дым и стол — настоящая фотография, на экранах наш
 * терминал по точным изогнутым контурам (heroDeskLive.ts). Картинки готовит
 * scratchpad/make_hero_assets.py: кадр с погашенными экранами, свет кольца и «кольцо выключено».
 *
 * Вступление идёт само, медленно (8 с): в комнате загорается свет, мониторы плавно включаются,
 * камера отъезжает, кольцо прорисовывается по кругу: заплатка «кольцо выключено» снимается
 * вслед за бликом. Дальше сцена живёт без конца:
 *   · на мониторах идут свечи, цена выходит из накопления, терминал отмечает зону и уровень;
 *   · всплывает карточка «Допуск» или «Отказ»;
 *   · по настоящему кольцу бежит блик, свечение дышит, в свете поднимается пыль;
 *   · на компьютере сцена слегка идёт за мышью: пыль сильнее стола — глубина.
 *
 * ⚠️ Устройство под 60 кадров (Сергей 22.10.2026: «тормозит страшно… 60 кадров в секунду должно»):
 *   · фото, затемнения, кромка, свечение кольца и дымка — отдельные слои, у которых меняются только
 *     прозрачность и сдвиг: это делает видеокарта без перерисовки;
 *   · подложка и стекло экранов нарисованы один раз (заготовки), в кадре их только копируют;
 *     заново рисуются лишь свечи, зоны и уровни;
 *   · блик на кольце считается в маленьком окне вокруг себя, а не по всему кольцу.
 * ⚠️ На экранах только свечи, уровни и зоны — без индикаторов (Сергей 21.10.2026).
 */

// лицевая сторона мониторов на кадре 1672×941 (замеры measure_monitors.py, 23.10.2026)
const LEFT: ScreenDef = { x0: 819, x1: 1151.5, top: [-0.0001549, 0.238506, 216.3433], bot: [0.0001704, -0.312778, 618.6482] };
const RIGHT: ScreenDef = { x0: 1157.5, x1: 1581, top: [-0.0002235, 0.4116427, 107.5255], bot: [7.72e-5, -0.1567598, 561.3228], chin: 0.0139 };
// рамка обоих мониторов: в ней лежат заготовки экранов
const MON_BOX = { x: 812, y: 196, w: 776, h: 330 };
// кольцо на кадре и рамка картинок света кольца
const RING = { x: 1214.7, y: 312.4, r: 268.7 };
const RING_BOX = { x: 922, y: 19, w: 585, h: 586 };
// видимая на фото часть кольца начинается у левого монитора и идёт по часовой через верх
const RING_START = (185 * Math.PI) / 180;
const INTRO_MS = 8000;
// блик: голова и хвост — пятна вдоль кольца (отставание в радианах, яркость, радиус)
const COMET: [number, number, number][] = [[0, 1, 46], [0.12, 0.65, 40], [0.24, 0.4, 34], [0.36, 0.2, 28]];
const COMET_WIN = 280;

// инструменты в карточках — только то, что Сергей разбирает (нефть он не торгует)
const SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPJPY', 'BTCUSD', 'USDCAD', 'AUDJPY', 'ETHUSD', 'GBPUSD'];

// пылинки в свете кольца: x, y, радиус, скорость подъёма, фаза
const DUST = Array.from({ length: 26 }, (_, i) => {
  const r = (k: number) => (((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1) + 1) % 1;
  return { x: 860 + r(1) * 760, y: 30 + r(2) * 560, s: 0.9 + r(3) * 1.9, v: 6 + r(4) * 14, ph: r(5) * 6.28 };
});

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);
// угол прорисовки кольца: видимую верхнюю дугу (~155°) проходим за 70% времени, остальное — быстрее
const sweepAngle = (t: number) =>
  RING_START + (t < 0.7 ? 0.43 * (t / 0.7) : 0.43 + 0.57 * ((t - 0.7) / 0.3)) * Math.PI * 2;

type Props = {
  /** 'wide' — сцена целиком справа от текста; 'narrow' — мониторы и кольцо (полоса на телефоне) */
  variant: 'wide' | 'narrow';
  className?: string;
};

// телефон: в кадре мониторы с кольцом, во всю ширину полосы.
// Компьютер: сцена вписывается целиком в правую половину, чтобы мониторы не заходили под текст.
const VIEW = {
  narrow: { vb: [790, 30, 830, 560], slice: true, ax: 0.5, attr: 'xMidYMid slice' },
  wide: { vb: [620, 0, 1052, 941], slice: false, ax: 1, attr: 'xMaxYMid meet' },
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

const SCREEN_L = makeScreen(LEFT);
const SCREEN_R = makeScreen(RIGHT);

export default function HeroDeskScene({ variant, className }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(s: string) => el.querySelector(s) as T;
    const zoom = q<HTMLDivElement>('[data-zoom]');
    const back = q<HTMLDivElement>('[data-back]');
    const chartsCv = q<HTMLCanvasElement>('[data-charts]');
    const hazeCv = q<HTMLCanvasElement>('[data-haze]');
    const fxCv = q<HTMLCanvasElement>('[data-fx]');
    const ringOffEl = q<SVGSVGElement>('[data-ringoff]');
    const ringGlowEl = q<SVGSVGElement>('[data-ringglow]');
    const off = q<SVGSVGElement>('[data-off]');
    const dark = q<SVGSVGElement>('[data-dark]');
    const dark2 = q<HTMLDivElement>('[data-dark2]');
    const rim = q<SVGSVGElement>('[data-rim]');
    const edge = q<HTMLDivElement>('[data-edge]');
    const card = q<HTMLDivElement>('[data-card]');
    const cx = chartsCv.getContext('2d');
    const fx = fxCv.getContext('2d');
    const hz = hazeCv.getContext('2d');
    if (!cx || !fx || !hz) return;

    // свет кольца и «кольцо выключено» нужны и холсту (прорисовка, блик): грузим рядом со сценой
    const ringLight = new Image();
    const ringOff = new Image();
    // свет кольца с прозрачными полями по COMET_WIN / 2: окно блика всегда целиком внутри картинки.
    // Safari рисует кусок, вылезающий за край картинки, со сдвигом, и блик уходил с кольца
    // (Сергей 23.10.2026, планшет: «блик идёт не по кольцу… где-то вне кольца»)
    const lightPad = document.createElement('canvas');
    let ringReady = 0;
    const onImg = () => { ringReady++; };
    ringLight.onload = () => {
      lightPad.width = RING_BOX.w + COMET_WIN;
      lightPad.height = RING_BOX.h + COMET_WIN;
      lightPad.getContext('2d')?.drawImage(ringLight, COMET_WIN / 2, COMET_WIN / 2, RING_BOX.w, RING_BOX.h);
      onImg();
    };
    ringOff.onload = onImg;
    ringLight.src = ringLightUrl; ringOff.src = ringOffUrl;

    // карточка терминала: одна за раз, не чаще раза в 6 с
    let screensOn = 0;
    let ringOn = 0;
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
      new LiveScreen(SCREEN_L, 74, 1700, 7, onEvent),
      new LiveScreen(SCREEN_R, 96, 1300, 21, onEvent),
    ];

    // погасший до нуля слой прячем совсем: видеокарте не нужно его складывать с остальными
    const fade = (node: HTMLElement | SVGElement, o: number) => {
      node.style.opacity = o.toFixed(3);
      node.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
    };
    const render = (p: number) => {
      const light = ease(seg(p, 0.02, 0.3));
      fade(dark2, 0.78 * (1 - light));
      fade(dark, 1 - 0.75 * light);
      fade(rim, 1 - ease(seg(p, 0.18, 0.42)));
      screensOn = ease(seg(p, 0.3, 0.58));
      fade(off, 1 - screensOn);
      ringOn = seg(p, 0.6, 0.97);
      // пока кольцо не начало прорисовываться, оно целиком закрыто неподвижной заплаткой
      fade(ringOffEl, ringOn > 0 ? 0 : 1);
      zoom.style.transform = `scale(${(1.14 - 0.14 * ease(p)).toFixed(4)})`;
    };

    // размеры холстов, заготовки экранов и спрайты: пересчитываются при смене размера блока
    let W = 0, H = 0, dpr = 1;
    let F = fit(variant, 1, 1);
    let dotSpr: HTMLCanvasElement | null = null;
    let spotSpr: HTMLCanvasElement | null = null;
    const cometCv = document.createElement('canvas');
    const underCv = document.createElement('canvas');
    const overCv = document.createElement('canvas');
    let monX = 0, monY = 0;
    // дымка не ложится на экраны: всё, кроме лицевой стороны мониторов
    const outside = new Path2D();
    outside.rect(-400, -400, 2500, 1800);
    outside.addPath(SCREEN_L.face);
    outside.addPath(SCREEN_R.face);
    const layout = () => {
      W = el.clientWidth; H = el.clientHeight;
      if (!W || !H) return;
      // плотность холстов не выше 1,5: на «ретине» разницы не видно, а пикселей почти вдвое меньше
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const c of [chartsCv, fxCv, hazeCv]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      F = fit(variant, W, H);
      const s = F.k * dpr;
      zoom.style.transformOrigin = `${(F.tx + 1200 * F.k).toFixed(1)}px ${(F.ty + 380 * F.k).toFixed(1)}px`;
      // верхний и нижний край вписанного кадра растворяются в фоне страницы: без видимой «ступеньки»
      const top = F.ty, bot = H - (F.ty + 941 * F.k);
      edge.style.background =
        `linear-gradient(180deg, var(--v3-bg) ${(top + 8).toFixed(0)}px, transparent ${(top + 8 + 80 * F.k).toFixed(0)}px),` +
        `linear-gradient(0deg, var(--v3-bg) ${(bot + 8).toFixed(0)}px, transparent ${(bot + 8 + 110 * F.k).toFixed(0)}px)`;

      // заготовки экранов: подложка с интерфейсом и стекло поверх графика
      monX = Math.floor((MON_BOX.x * F.k + F.tx) * dpr);
      monY = Math.floor((MON_BOX.y * F.k + F.ty) * dpr);
      for (const [cv, part] of [[underCv, 'under'], [overCv, 'over']] as const) {
        cv.width = Math.ceil(MON_BOX.w * s) + 4;
        cv.height = Math.ceil(MON_BOX.h * s) + 4;
        const c = cv.getContext('2d');
        if (!c) continue;
        c.setTransform(s, 0, 0, s, F.tx * dpr - monX, F.ty * dpr - monY);
        for (const sc of screens) if (part === 'under') sc.drawUnder(c); else sc.drawOver(c);
      }

      // дымка в свете кольца — один раз, дальше у слоя меняется только прозрачность
      hz.setTransform(1, 0, 0, 1, 0, 0);
      hz.clearRect(0, 0, hazeCv.width, hazeCv.height);
      hz.setTransform(s, 0, 0, s, F.tx * dpr, F.ty * dpr);
      hz.save();
      hz.clip(outside, 'evenodd');
      const g = hz.createRadialGradient(RING.x, RING.y, 0, RING.x, RING.y, 460);
      g.addColorStop(0, 'rgba(243,177,79,0.22)'); g.addColorStop(0.6, 'rgba(200,134,47,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      hz.fillStyle = g;
      hz.fillRect(RING.x - 460, RING.y - 460, 920, 920);
      hz.restore();

      dotSpr = sprite(24 * dpr, (c) => {
        const h = 12 * dpr;
        const gr = c.createRadialGradient(h, h, 0, h, h, h);
        gr.addColorStop(0, 'rgba(255,220,166,1)'); gr.addColorStop(0.35, 'rgba(255,220,166,0.55)'); gr.addColorStop(1, 'rgba(255,220,166,0)');
        c.fillStyle = gr; c.fillRect(0, 0, h * 2, h * 2);
      });
      // пятно, которое вырезает из света кольца бегущий блик
      spotSpr = sprite(160, (c) => {
        const gr = c.createRadialGradient(80, 80, 0, 80, 80, 80);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr; c.fillRect(0, 0, 160, 160);
      });
      cometCv.width = cometCv.height = Math.max(2, Math.ceil(COMET_WIN * s));
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    /** бегущий блик: свет кольца в окне вокруг головы, вырезанный пятнами головы и хвоста */
    const drawComet = (ang: number, alpha: number) => {
      if (!spotSpr || ringReady < 2) return;
      const c2 = cometCv.getContext('2d');
      if (!c2) return;
      // окно вокруг середины блика, в координатах кадра
      const mid = ang - 0.18;
      const wx = Math.round(RING.x + RING.r * Math.cos(mid) - COMET_WIN / 2);
      const wy = Math.round(RING.y + RING.r * Math.sin(mid) - COMET_WIN / 2);
      const k = cometCv.width / COMET_WIN;
      c2.globalCompositeOperation = 'source-over';
      c2.clearRect(0, 0, cometCv.width, cometCv.height);
      for (const [lag, a, rad] of COMET) {
        const t = ang - lag;
        const px = (RING.x + RING.r * Math.cos(t) - wx) * k;
        const py = (RING.y + RING.r * Math.sin(t) - wy) * k;
        c2.globalAlpha = a;
        c2.drawImage(spotSpr, px - rad * k, py - rad * k, rad * 2 * k, rad * 2 * k);
      }
      c2.globalAlpha = 1;
      c2.globalCompositeOperation = 'source-in';
      // свет кольца — в масштабе кадра 1:1, начало картинки в RING_BOX плюс поля
      const pad = COMET_WIN / 2;
      c2.drawImage(lightPad, wx - RING_BOX.x + pad, wy - RING_BOX.y + pad, COMET_WIN, COMET_WIN, 0, 0, cometCv.width, cometCv.height);
      cx.globalAlpha = alpha;
      cx.drawImage(cometCv, wx, wy, COMET_WIN, COMET_WIN);
      cx.globalAlpha = 1;
    };

    // экраны, прорисовка кольца и блик — под затемнениями, вместе с фото
    const drawCharts = (now: number, dt: number) => {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, chartsCv.width, chartsCv.height);
      if (screensOn > 0) cx.drawImage(underCv, monX, monY);
      cx.setTransform(F.k * dpr, 0, 0, F.k * dpr, F.tx * dpr, F.ty * dpr);
      const t = now / 1000;
      if (ringReady >= 2 && ringOn > 0) {
        if (ringOn < 1) {
          // незажжённая часть кольца закрыта заплаткой, зажжённая светится ярче обычного
          const ang = sweepAngle(ringOn);
          cx.save();
          cx.beginPath();
          cx.moveTo(RING.x, RING.y);
          cx.arc(RING.x, RING.y, RING.r + 60, ang, RING_START + Math.PI * 2);
          cx.closePath();
          cx.clip();
          cx.drawImage(ringOff, RING_BOX.x, RING_BOX.y, RING_BOX.w, RING_BOX.h);
          cx.restore();
          cx.save();
          cx.beginPath();
          cx.moveTo(RING.x, RING.y);
          cx.arc(RING.x, RING.y, RING.r + 60, RING_START, ang);
          cx.closePath();
          cx.clip();
          cx.globalAlpha = 0.45 - 0.25 * ringOn;
          cx.drawImage(ringLight, RING_BOX.x, RING_BOX.y, RING_BOX.w, RING_BOX.h);
          cx.restore();
          cx.globalAlpha = 1;
          drawComet(ang, 1);
        } else {
          drawComet(sweepAngle(1) + (t * 120) / RING.r, 0.95);
        }
      }
      if (screensOn > 0) {
        for (const sc of screens) sc.drawLive(cx, now, dt);
        cx.setTransform(1, 0, 0, 1, 0, 0);
        cx.drawImage(overCv, monX, monY);
      }
    };

    // пыль медленно поднимается в свете и мерцает; слой с пылью идёт за мышью сильнее стола
    const drawFx = (now: number) => {
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.clearRect(0, 0, fxCv.width, fxCv.height);
      if (!dotSpr) return;
      const t = now / 1000;
      fx.setTransform(F.k * dpr, 0, 0, F.k * dpr, F.tx * dpr, F.ty * dpr);
      const base = Math.max(0.15, screensOn);
      for (const d of DUST) {
        const y = (((d.y - t * d.v) % 600) + 600) % 600 + 10;
        const x = d.x + Math.sin(t * 0.6 + d.ph) * 14;
        fx.globalAlpha = base * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + d.ph)));
        const r = d.s * 2.4;
        fx.drawImage(dotSpr, x - r, y - r, r * 2, r * 2);
      }
      fx.globalAlpha = 1;
    };

    // свечение кольца и дымка: только прозрачность слоёв, пишем при заметном изменении
    let lastGlow = '', lastHaze = '';
    const breathe = (now: number) => {
      const t = now / 1000;
      const glow = ringOn >= 1 ? 0.16 + 0.06 * Math.sin(t * 0.7) : 0;
      const haze = ringOn * (0.7 + 0.3 * Math.sin(t * 0.7));
      const g = glow.toFixed(2), h = haze.toFixed(2);
      if (g !== lastGlow) { fade(ringGlowEl, glow); lastGlow = g; }
      if (h !== lastHaze) { fade(hazeCv, haze); lastHaze = h; }
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(1);
      const now = performance.now();
      // картинки кольца могут ещё грузиться: нарисуем, когда придут
      const still = () => { drawCharts(now, 1000); drawFx(now); breathe(now); };
      still();
      ringLight.addEventListener('load', still);
      ringOff.addEventListener('load', still);
      return () => { ro.disconnect(); };
    }

    // глубина за курсором (только мышь): стол сдвигается чуть-чуть, пыль сильнее
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
    let lastBack = '', lastFx = '';
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
      drawFx(now);
      breathe(now);
      if (screensOn > 0.95 && now - cardAt > 7000) screens[cardN % 2].nudge();

      const bt = `translate3d(${(-mx * 8 * F.k).toFixed(1)}px, ${(-my * 5 * F.k).toFixed(1)}px, 0)`;
      const ft = `translate3d(${(-mx * 22 * F.k).toFixed(1)}px, ${(-my * 14 * F.k).toFixed(1)}px, 0)`;
      if (bt !== lastBack) { back.style.transform = bt; lastBack = bt; }
      if (ft !== lastFx) { fxCv.style.transform = ft; lastFx = ft; }
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
  const ringImg = (href: string) => <image href={href} x={RING_BOX.x} y={RING_BOX.y} width={RING_BOX.w} height={RING_BOX.h} />;

  return (
    <div ref={root} className={`hd-scene relative overflow-hidden ${className ?? ''}`} aria-hidden="true">
      <div data-zoom className="hd-layer" style={{ transform: 'scale(1.14)' }}>
        <div data-back className="hd-layer">
          <svg {...svgProps}><image href={deskImg} width="1672" height="941" /></svg>
          {/* кольцо, пока не зажглось: неподвижная заплатка, во время прорисовки её снимает холст */}
          <svg data-ringoff {...svgProps}>{ringImg(ringOffUrl)}</svg>
          {/* живые мониторы, прорисовка кольца и бегущий блик (heroDeskLive.ts) */}
          <canvas data-charts className="hd-layer" />
          <svg data-ringglow {...svgProps} style={{ opacity: 0 }}>{ringImg(ringLightUrl)}</svg>
          <canvas data-haze className="hd-layer" style={{ opacity: 0 }} />
          <svg data-off {...svgProps}>
            <path d={SCREEN_L.svg} fill="#040507" />
            <path d={SCREEN_R.svg} fill="#040507" />
          </svg>
          <svg data-dark {...svgProps}>
            <defs>
              <radialGradient id={`hd-lamp-${variant}`} cx="70%" cy="40%" r="62%">
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
              <path d={SCREEN_L.svg} />
              <path d={SCREEN_R.svg} />
            </g>
          </svg>
          <div data-edge className="hd-layer" />
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
