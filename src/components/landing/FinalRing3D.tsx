import { useEffect, useRef, useState } from 'react';
import FinalRing, { ringCount, RING_DRAW_IN } from './FinalRing';
import { createRing3D } from './ring3d';

/**
 * Кольцо последнего экрана объёмным предметом — проба 3D по адресу с ?3d (23.10.2026). Отсчёт тот же,
 * что у плоского кольца (ringCount): прорисовка, 7 дуг по одной, вспышка, угасание. Наклон: за прокруткой —
 * блок подъезжает снизу, кольцо разворачивается к зрителю; на компьютере ещё и за мышью. Без WebGL —
 * прежнее плоское кольцо.
 */
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

export default function FinalRing3D() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    const canvas = cv.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;
    const ring = createRing3D(canvas);
    if (!ring) { setFlat(true); return; }

    let W = 0;
    const layout = () => {
      W = section.clientWidth;
      const H = section.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const anchor = section.querySelector('[data-ring-center]') as HTMLElement | null;
      const sr = section.getBoundingClientRect();
      let cx = W / 2, cy = H * 0.4;
      if (anchor) {
        const ar = anchor.getBoundingClientRect();
        cx = ar.left - sr.left + ar.width / 2; cy = ar.top - sr.top + ar.height / 2;
      }
      ring.resize(W, H, dpr, cx, cy, Math.min(W * (W < 768 ? 0.44 : 0.3), 330));
    };

    const frame = (clock: number, tiltX: number, tiltY: number) => {
      const { draw01, lit, flash, fadeOut } = ringCount(clock);
      const seg = Array.from({ length: 7 }, (_, i) => 0.2 + 0.85 * ease(Math.max(0, Math.min(1, lit - i)) * fadeOut) + 0.3 * flash);
      ring.draw({ seg, drawn: draw01, glow: draw01 * (0.75 + 0.35 * flash), tiltX, tiltY, time: clock });
    };

    // «меньше движения»: кольцо стоит, все 7 дуг горят, чуть наклонено
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ro = new ResizeObserver(() => { layout(); if (still) frame(RING_DRAW_IN + 7 * 0.8, 0.22, -0.18); });
    ro.observe(section);
    if (still) return () => ro.disconnect();

    // мышь — только на компьютере; на телефоне кольцо поворачивается за прокруткой
    let mx = 0, my = 0;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;
      mx = (ev.clientX / window.innerWidth) * 2 - 1;
      my = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = false;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.2 });
    io.observe(section);
    let raf = 0, clock = 0, last = 0, tx = 0.45, ty = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || !W) { last = 0; return; }
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      clock += dt;
      last = now;
      // блок ниже середины экрана — кольцо сильнее наклонено верхом к зрителю; к середине выпрямляется
      const r = section.getBoundingClientRect();
      const s = clamp1((r.top + r.height * 0.4 - window.innerHeight / 2) / window.innerHeight);
      const goalX = 0.2 + 0.32 * s - 0.1 * my;
      const goalY = 0.3 * mx + 0.07 * Math.sin(clock * 0.35);
      const k = 1 - Math.exp(-dt / 0.45);
      tx += (goalX - tx) * k; ty += (goalY - ty) * k;
      frame(clock, tx, ty);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  if (flat) return <FinalRing />;
  return <canvas ref={cv} className="final-ring" aria-hidden="true" />;
}
