import { useEffect, useRef } from 'react';

/**
 * StructureField — the v3 hero background: an abstract "market structure" field.
 * A faint terminal grid, a few slow horizontal "levels", and drifting nodes
 * connected by thin gold lines when near — minimal, precise, on-message
 * ("structure over signal"). Faint gold, masked to the centre-left so the
 * headline/photo lead. Pure canvas + rAF; reduced-motion paints one static frame.
 */
const GOLD = '225,168,77'; // v3 gold (#e1a84d) rgb

const DEFAULT_MASK = 'radial-gradient(120% 90% at 42% 50%, #000 35%, transparent 80%)';

export default function StructureField({
  position = 'absolute',
  opacity = 1,
  mask = DEFAULT_MASK,
  zIndex = 0,
}: {
  position?: 'absolute' | 'fixed';
  opacity?: number;
  mask?: string;
  zIndex?: number;
} = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1, raf = 0, t0 = performance.now();
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    let levels: number[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      nodes = Array.from({ length: 9 }, () => ({
        x: Math.random() * w,
        y: h * 0.2 + Math.random() * h * 0.6,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12,
      }));
      levels = [0.34, 0.52, 0.68].map(p => h * p);
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // faint terminal grid
      ctx.strokeStyle = `rgba(${GOLD},0.03)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // horizontal "levels" — slow breathing dashed lines
      levels.forEach((y, i) => {
        const a = 0.06 + 0.04 * Math.sin(t * 0.5 + i);
        ctx.strokeStyle = `rgba(${GOLD},${a})`;
        ctx.setLineDash([6, 10]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        ctx.setLineDash([]);
      });

      // drift + bounce nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < h * 0.15 || n.y > h * 0.85) n.vy *= -1;
      }

      // links between near nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 240) {
            ctx.strokeStyle = `rgba(${GOLD},${(1 - d / 240) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD},0.7)`;
        ctx.shadowColor = `rgb(${GOLD})`; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize(); seed();
    if (reduce) draw(performance.now());
    else raf = requestAnimationFrame(draw);

    let lastW = window.innerWidth;
    const onResize = () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; resize(); seed(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position, inset: 0, width: '100%', height: '100%', zIndex, pointerEvents: 'none', opacity,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
