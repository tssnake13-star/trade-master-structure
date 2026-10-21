import { useEffect, useRef } from 'react';
import deskImg from '@/assets/hero-desk.jpg';

/**
 * Сцена первого экрана: рабочее место трейдера, которое оживает.
 * 21.10.2026, Сергей по образцу (сайт барбершопа, где кресло и машинки «живут» при прокрутке):
 * «хочу добавить вот такую анимацию… по теме трейдинга». Проба утверждена: «да, ставь на сайт».
 *
 * Картинка одна (кадр из Nano Banana), всё движение — кодом поверх неё, поэтому сцена не прыгает:
 *   0 → 0,30   в комнате загорается свет, золотая кромка мониторов гаснет;
 *   0,32 → 0,55 мониторы включаются с миганием;
 *   весь путь   камера медленно отъезжает;
 *   0,62 → 0,92 за мониторами прорисовывается золотое кольцо, за ним дымка.
 * ⚠️ Графики на экранах перерисованы своими (scratchpad screens.py): только свечи, уровни
 * и зона накопления. Сергей 21.10: «индикаторы… осцилляторы внизу… мы их не используем».
 * Новую картинку сюда — тоже без индикаторов.
 *
 * progress(): откуда брать долю 0…1. Если не передан, сцена проигрывается сама за 3,6 с
 * (телефон и экраны, где первый экран не помещается и закреплять его нельзя).
 */

const LEFT = '689,205 1172,200 1172,470 691,470';
const RIGHT = '1180,200 1636,163 1633,537 1180,475';
const RING_R = 292;
const RING_C = 2 * Math.PI * RING_R;

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

    const render = (p: number) => {
      const light = ease(seg(p, 0.02, 0.3));
      dark2.style.opacity = (0.78 * (1 - light)).toFixed(3);
      dark.style.opacity = (1 - 0.75 * light).toFixed(3);
      rim.style.opacity = (1 - ease(seg(p, 0.18, 0.42))).toFixed(3);
      const on = seg(p, 0.32, 0.55);
      const flicker = on > 0 && on < 0.45 && Math.sin(on * 60) > 0.2 ? 0.25 : 0;
      off.style.opacity = clamp(1 - ease(on) + flicker).toFixed(3);
      scene.style.transform = `scale(${(1.14 - 0.14 * ease(p)).toFixed(4)})`;
      const r = ease(seg(p, 0.62, 0.92));
      ring.style.strokeDashoffset = (RING_C * (1 - r)).toFixed(1);
      ring.style.opacity = r > 0 ? '1' : '0';
      haze.style.opacity = ease(seg(p, 0.7, 1)).toFixed(3);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(1);
      return;
    }

    let raf = 0;
    if (progress) {
      // закреплённый первый экран: доля берётся из прокрутки
      let last = -1;
      const loop = () => {
        const p = progress();
        if (p !== null && Math.abs(p - last) > 0.0005) { render(p); last = p; }
        raf = requestAnimationFrame(loop);
      };
      render(progress() ?? 0);
      raf = requestAnimationFrame(loop);
    } else {
      // сама: короткая пауза в темноте, потом 3,6 с до финала
      const t0 = performance.now() + 500;
      const loop = (t: number) => {
        const p = clamp((t - t0) / 3600);
        render(p);
        if (p < 1) raf = requestAnimationFrame(loop);
      };
      render(0);
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  // телефон: в кадре только мониторы и стол, во всю ширину полосы
  // На компьютере сцена вписывается целиком (meet) в правую половину: мониторы не должны
  // заходить под текст. Края картинки прячет затемнение .v3h-scene::after.
  const viewBox = variant === 'narrow' ? '640 90 1032 800' : '650 0 1022 941';
  const aspect = variant === 'narrow' ? 'xMidYMid slice' : 'xMaxYMid meet';

  return (
    <div ref={root} className={className} aria-hidden="true">
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
            <rect width="1672" height="941" fill="#fff" />
            <polygon points="684,198 1176,194 1178,478 686,476" fill="#000" />
            <polygon points="1176,194 1642,158 1640,545 1176,482" fill="#000" />
            <rect x="0" y="545" width="1672" height="396" fill="#000" />
            <rect x="1035" y="470" width="150" height="80" fill="#000" />
          </mask>
        </defs>

        <g data-scene style={{ transformOrigin: '1240px 400px', transform: 'scale(1.14)' }}>
          <image href={deskImg} width="1672" height="941" />
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
          <g mask={`url(#hd-behind-${variant})`}>
            <ellipse data-haze cx="1270" cy="300" rx="460" ry="360" fill={`url(#hd-haze-${variant})`} style={{ opacity: 0 }} />
            <circle
              data-ring cx="1270" cy="300" r={RING_R} fill="none" stroke="#ffcf7a" strokeWidth="7"
              filter={`url(#hd-glow-${variant})`} strokeLinecap="round" transform="rotate(-90 1270 300)"
              style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C, opacity: 0 }}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
