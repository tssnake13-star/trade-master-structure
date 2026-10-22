import { useEffect, useRef } from 'react';
import deskImg from '@/assets/hero-desk.jpg';
import { LiveScreen, type LiveEvent } from './heroDeskLive';

/**
 * Сцена первого экрана: рабочее место трейдера, которое оживает.
 * 21.10.2026, Сергей по образцу (сайт барбершопа, где кресло и машинки «живут» при прокрутке):
 * «хочу добавить вот такую анимацию… по теме трейдинга». Проба утверждена: «да, ставь на сайт».
 *
 * Картинка одна (кадр из Nano Banana), всё движение — кодом поверх неё, поэтому сцена не прыгает.
 * Вступление (прокрутка на компьютере или само за 3,6 с):
 *   0 → 0,30   в комнате загорается свет, золотая кромка мониторов гаснет;
 *   0,32 → 0,55 мониторы включаются с миганием;
 *   весь путь   камера медленно отъезжает;
 *   0,62 → 0,92 за мониторами прорисовывается золотое кольцо, за ним дымка.
 *
 * 22.10.2026, Сергей: «один раз появилась, и всё… эффекта вау нету… постоянно что-то
 * происходило». После вступления сцена живёт без конца:
 *   · на мониторах идут свечи в реальном времени, цена ходит в накоплении и выходит из него,
 *     терминал подсвечивает зону и проводит уровень (heroDeskLive.ts);
 *   · всплывает карточка «Допуск» или «Отказ» — ложный выход система отсекает;
 *   · по кольцу бежит блик, свечение дышит, в свете поднимается пыль;
 *   · на компьютере сцена чуть сдвигается за мышью: кольцо и пыль сильнее, чем стол — глубина.
 * ⚠️ На экранах только свечи, уровни и зоны — без индикаторов (Сергей 21.10.2026).
 * ⚠️ В карточках нет цен, тейков и процентов: это показ того, как работает терминал.
 */

const LEFT = '689,205 1172,200 1172,470 691,470';
const RIGHT = '1180,200 1636,163 1633,537 1180,475';
const LEFT_Q: [[number, number], [number, number], [number, number], [number, number]] = [[689, 205], [1172, 200], [1172, 470], [691, 470]];
const RIGHT_Q: [[number, number], [number, number], [number, number], [number, number]] = [[1180, 200], [1636, 163], [1633, 537], [1180, 475]];
const RING_R = 292;
const RING_C = 2 * Math.PI * RING_R;

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
  progress?: () => number | null;
  className?: string;
};

export default function HeroDeskScene({ variant, progress, className }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends Element>(s: string) => el.querySelector(s) as T;
    const scene = q<SVGGElement>('[data-scene]');
    const off = q<SVGGElement>('[data-off]');
    const dark = q<SVGRectElement>('[data-dark]');
    const dark2 = q<SVGRectElement>('[data-dark2]');
    const rim = q<SVGGElement>('[data-rim]');
    const ring = q<SVGCircleElement>('[data-ring]');
    const haze = q<SVGEllipseElement>('[data-haze]');
    const comet = q<SVGCircleElement>('[data-comet]');
    const dust = q<SVGGElement>('[data-dust]');
    const live = q<SVGGElement>('[data-live]');
    const img = q<SVGGElement>('[data-img]');
    const front = q<SVGGElement>('[data-front]');
    const card = q<HTMLDivElement>('[data-card]');
    const dots = Array.from(dust.children) as SVGCircleElement[];
    let screensOn = 0;
    let ringOn = 0;

    const render = (p: number) => {
      const light = ease(seg(p, 0.02, 0.3));
      dark2.style.opacity = (0.78 * (1 - light)).toFixed(3);
      dark.style.opacity = (1 - 0.75 * light).toFixed(3);
      rim.style.opacity = (1 - ease(seg(p, 0.18, 0.42))).toFixed(3);
      const on = seg(p, 0.3, 0.58);
      off.style.opacity = (1 - ease(on)).toFixed(3);
      screensOn = ease(on);
      live.style.opacity = screensOn.toFixed(3);
      scene.style.transform = `scale(${(1.14 - 0.14 * ease(p)).toFixed(4)})`;
      ringOn = ease(seg(p, 0.6, 0.97));
      ring.style.strokeDashoffset = (RING_C * (1 - ringOn)).toFixed(1);
      ring.style.opacity = ringOn > 0 ? '1' : '0';
    };

    // карточка терминала: одна за раз, не чаще раза в 5 с
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
      card.classList.remove('is-on');
      void card.offsetWidth;
      card.classList.add('is-on');
      window.clearTimeout(cardTimer);
      cardTimer = window.setTimeout(() => card.classList.remove('is-on'), 4600);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(1);
      haze.style.opacity = '1';
      const now = performance.now();
      new LiveScreen(live, LEFT_Q, 46, 1100, 7, () => {}).draw(now);
      new LiveScreen(live, RIGHT_Q, 64, 800, 21, () => {}).draw(now);
      return () => { live.replaceChildren(); };
    }

    const screens = [
      new LiveScreen(live, LEFT_Q, 46, 1700, 7, onEvent),
      new LiveScreen(live, RIGHT_Q, 64, 1300, 21, onEvent),
    ];

    // глубина за курсором: стол сдвигается чуть-чуть, кольцо и пыль сильнее (только мышь)
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;
      tx = (ev.clientX / window.innerWidth) * 2 - 1;
      ty = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // за краем экрана сцена не считается
    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(el);

    const t0 = performance.now() + 700;
    const INTRO_MS = 8000;
    let shown = 0;
    let lastP = -1;
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      // по прокрутке сцена не прыгает за пальцем, а плавно догоняет: даже быстрая прокрутка
      // даёт медленное включение (Сергей 22.10: «плавно должно включаться»)
      const target = progress ? progress() : clamp((now - t0) / INTRO_MS);
      if (target !== null) shown += (target - shown) * (progress ? 0.025 : 1);
      if (Math.abs(shown - lastP) > 0.0003) { render(shown); lastP = shown; }

      // мониторы живут, пока включены; каждый кадр — движение без рывков
      if (screensOn > 0) {
        for (const sc of screens) sc.draw(now);
        // карточка не реже чем раз в 5,5 с: если рынок затянул накопление, подталкиваем выход
        if (screensOn > 0.95 && now - cardAt > 7000) screens[cardN % 2].nudge();
      }

      // кольцо: по нему бежит блик, свечение дышит
      const t = now / 1000;
      comet.style.strokeDashoffset = (-((t * 120) % RING_C)).toFixed(1);
      comet.style.opacity = (ringOn * 0.9).toFixed(3);
      haze.style.opacity = (ringOn * (0.8 + 0.2 * Math.sin(t * 0.7))).toFixed(3);

      // пыль медленно поднимается в свете и мерцает
      for (let i = 0; i < dots.length; i++) {
        const k = DUST[i];
        const y = (((k.y - t * k.v) % 600) + 600) % 600 + 20;
        dots[i].setAttribute('cy', y.toFixed(1));
        dots[i].setAttribute('cx', (k.x + Math.sin(t * 0.6 + k.ph) * 14).toFixed(1));
        dots[i].style.opacity = (Math.max(0.15, screensOn) * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + k.ph)))).toFixed(3);
      }

      mx += (tx - mx) * 0.03;
      my += (ty - my) * 0.03;
      img.setAttribute('transform', `translate(${(-mx * 8).toFixed(2)} ${(-my * 5).toFixed(2)})`);
      front.setAttribute('transform', `translate(${(-mx * 22).toFixed(2)} ${(-my * 14).toFixed(2)})`);
    };
    render(progress?.() ?? 0);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
      window.clearTimeout(cardTimer);
      live.replaceChildren();
    };
  }, [progress]);

  // телефон: в кадре только мониторы и стол, во всю ширину полосы.
  // Компьютер: сцена вписывается целиком (meet) в правую половину, чтобы мониторы
  // не заходили под текст; края картинки прячет затемнение .v3h-scene::after.
  const viewBox = variant === 'narrow' ? '640 90 1032 800' : '650 0 1022 941';
  const aspect = variant === 'narrow' ? 'xMidYMid slice' : 'xMaxYMid meet';

  return (
    <div ref={root} className={`relative ${className ?? ''}`} aria-hidden="true">
      <svg viewBox={viewBox} preserveAspectRatio={aspect} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <filter id={`hd-glow-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="26" result="b2" />
            <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`hd-soft-${variant}`}><feGaussianBlur stdDeviation="2.2" /></filter>
          <radialGradient id={`hd-haze-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#f3b14f" stopOpacity=".30" />
            <stop offset=".6" stopColor="#c8862f" stopOpacity=".10" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`hd-lamp-${variant}`} cx="66%" cy="58%" r="62%">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset=".55" stopColor="#000" stopOpacity=".35" />
            <stop offset="1" stopColor="#000" stopOpacity="1" />
          </radialGradient>
          {/* кольцо видно только за мониторами: экраны и стол его закрывают */}
          <mask id={`hd-behind-${variant}`}>
            <rect x="-100" y="-100" width="1872" height="1141" fill="#fff" />
            <polygon points="684,198 1176,194 1178,478 686,476" fill="#000" />
            <polygon points="1176,194 1642,158 1640,545 1176,482" fill="#000" />
            <rect x="-100" y="545" width="1872" height="500" fill="#000" />
            <rect x="1035" y="470" width="150" height="80" fill="#000" />
          </mask>
        </defs>

        <g data-scene style={{ transformOrigin: '1240px 400px', transform: 'scale(1.14)' }}>
          <g data-img>
            <image href={deskImg} width="1672" height="941" />
            {/* живые мониторы: свечи, зоны накопления, уровни (heroDeskLive.ts) */}
            <g data-live style={{ opacity: 0 }} />
            <g data-off>
              <polygon points={LEFT} fill="#050506" />
              <polygon points={RIGHT} fill="#050506" />
            </g>
            <rect data-dark width="1672" height="941" fill={`url(#hd-lamp-${variant})`} />
            <rect data-dark2 width="1672" height="941" fill="#000" style={{ opacity: 0.78 }} />
            <g data-rim fill="none" stroke="#e9a54a" strokeWidth="2.4" filter={`url(#hd-soft-${variant})`}>
              <polygon points={LEFT} />
              <polygon points={RIGHT} />
            </g>
          </g>
          <g data-front>
            <g mask={`url(#hd-behind-${variant})`}>
              <ellipse data-haze cx="1270" cy="300" rx="460" ry="360" fill={`url(#hd-haze-${variant})`} style={{ opacity: 0 }} />
              <circle
                data-ring cx="1270" cy="300" r={RING_R} fill="none" stroke="#ffcf7a" strokeWidth="7"
                filter={`url(#hd-glow-${variant})`} strokeLinecap="round" transform="rotate(-90 1270 300)"
                style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C, opacity: 0 }}
              />
              {/* блик, который бежит по кольцу */}
              <circle
                data-comet cx="1270" cy="300" r={RING_R} fill="none" stroke="#fff3d6" strokeWidth="9"
                filter={`url(#hd-glow-${variant})`} strokeLinecap="round" transform="rotate(-90 1270 300)"
                style={{ strokeDasharray: `140 ${RING_C}`, opacity: 0 }}
              />
            </g>
            <g data-dust fill="#ffdca6" filter={`url(#hd-soft-${variant})`}>
              {DUST.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.s} style={{ opacity: 0 }} />)}
            </g>
          </g>
        </g>
      </svg>

      <div data-card className={`hd-card hd-card--${variant}`}>
        <div className="hd-card__head"><span className="hd-card__dot" />ECHO-GATE INSIDE · <b data-c-title>Допуск</b></div>
        <div className="hd-card__body" data-c-body />
        <div className="hd-card__foot" data-c-foot />
      </div>
    </div>
  );
}
