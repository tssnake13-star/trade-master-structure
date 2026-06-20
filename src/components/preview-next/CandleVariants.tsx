import { useEffect, useRef } from 'react';

/**
 * CandleVariants — several candlestick background animations for the hero,
 * selectable via the `variant` prop. Faint gold, masked to the center-left,
 * same visual language as the production CandleField. Used by /preview-candles
 * so the styles can be compared live. rAF-driven; reduced-motion paints once.
 */
export type CandleVariant = 'aura' | 'structure' | 'tape' | 'forming' | 'equity' | 'scan' | 'parallax';

const GOLD = '225,168,77'; // v3 gold (#e1a84d) as rgb

export default function CandleVariants({ variant }: { variant: CandleVariant }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1, raf = 0, t0 = performance.now();
    const STEP = 34, CW = 15;

    type C = { x: number; o: number; c: number; hi: number; lo: number; phase: number };
    const mkClose = (prev: number) => {
      const vol = 0.04 + Math.random() * 0.08;
      const dir = Math.random() < 0.55 ? 1 : -1;
      return Math.max(0.08, Math.min(0.92, prev + dir * vol));
    };

    // layers: scrolling variants use 1-2 moving layers; grid variants a fixed row
    type Layer = { candles: C[]; speed: number; alpha: number; last: number };
    let layers: Layer[] = [];
    // structure-variant data
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    let levels: number[] = [];

    const buildRow = (speed: number, alpha: number): Layer => {
      const candles: C[] = [];
      let last = 0.5;
      for (let x = -STEP; x < w + STEP * 2; x += STEP) {
        const o = last; const c = mkClose(o); last = c;
        candles.push({ x, o, c, hi: Math.max(o, c) + Math.random() * 0.06, lo: Math.min(o, c) - Math.random() * 0.06, phase: Math.random() });
      }
      return { candles, speed, alpha, last };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      if (variant === 'parallax') {
        layers = [buildRow(0.18, 0.6), buildRow(0.42, 1)];
      } else if (variant === 'tape') {
        layers = [buildRow(0.35, 1)];
      } else if (variant === 'structure') {
        nodes = Array.from({ length: 9 }, () => ({
          x: Math.random() * w, y: h * 0.2 + Math.random() * h * 0.6,
          vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.12,
        }));
        levels = [0.34, 0.52, 0.68].map(p => h * p);
      } else if (variant === 'aura') {
        // no geometry needed
      } else {
        layers = [buildRow(0, 1)]; // static grid for forming/equity/scan
      }
    };

    const yOf = (v: number) => h * 0.1 + (1 - v) * h * 0.8;

    const drawCandle = (k: C, baseAlpha: number, heightScale = 1) => {
      const up = k.c >= k.o;
      ctx.globalAlpha = (up ? 0.18 : 0.10) * baseAlpha;
      ctx.strokeStyle = `rgb(${GOLD})`;
      ctx.fillStyle = `rgb(${GOLD})`;
      ctx.lineWidth = 1;
      const midY = (yOf(k.hi) + yOf(k.lo)) / 2;
      const wickTop = midY + (yOf(k.hi) - midY) * heightScale;
      const wickLo = midY + (yOf(k.lo) - midY) * heightScale;
      ctx.beginPath(); ctx.moveTo(k.x, wickTop); ctx.lineTo(k.x, wickLo); ctx.stroke();
      const bodyTop0 = Math.min(yOf(k.o), yOf(k.c));
      const bodyMid = (yOf(k.o) + yOf(k.c)) / 2;
      const top = bodyMid + (bodyTop0 - bodyMid) * heightScale;
      const bh = Math.max(2, Math.abs(yOf(k.c) - yOf(k.o)) * heightScale);
      ctx.fillRect(k.x - CW / 2, top, CW, bh);
    };

    const grid = (alpha: number) => {
      ctx.strokeStyle = `rgba(${GOLD},${alpha})`;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    };

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // ---- aura: drifting warm light + faint terminal grid (no chart) ----
      if (variant === 'aura') {
        grid(0.035);
        const blob = (cx: number, cy: number, r: number, rgb: string, a: number) => {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        };
        ctx.globalCompositeOperation = 'screen';
        blob(w * 0.32 + Math.sin(t * 0.13) * w * 0.07, h * 0.42 + Math.cos(t * 0.1) * h * 0.1, w * 0.42, GOLD, 0.14);
        blob(w * 0.62 + Math.cos(t * 0.09) * w * 0.06, h * 0.6 + Math.sin(t * 0.11) * h * 0.08, w * 0.36, '138,166,214', 0.07);
        blob(w * 0.2 + Math.sin(t * 0.07) * w * 0.05, h * 0.75, w * 0.3, GOLD, 0.06);
        ctx.globalCompositeOperation = 'source-over';
        if (!reduce) raf = requestAnimationFrame(render);
        return;
      }

      // ---- structure: faint grid + horizontal levels + connected drifting nodes ----
      if (variant === 'structure') {
        grid(0.03);
        // horizontal "levels"
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
          ctx.fillStyle = `rgba(${GOLD},0.7)`; ctx.shadowColor = `rgb(${GOLD})`; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
        }
        if (!reduce) raf = requestAnimationFrame(render);
        return;
      }

      // ---- scrolling: tape, parallax ----
      if (variant === 'tape' || variant === 'parallax') {
        for (const L of layers) {
          for (const k of L.candles) k.x -= L.speed;
          while (L.candles.length && L.candles[0].x < -STEP * 2) L.candles.shift();
          const rm = L.candles.length ? L.candles[L.candles.length - 1].x : 0;
          if (rm < w + STEP) { const o = L.last; const c = mkClose(o); L.last = c; L.candles.push({ x: rm + STEP, o, c, hi: Math.max(o, c) + Math.random() * 0.06, lo: Math.min(o, c) - Math.random() * 0.06, phase: 0 }); }
          for (const k of L.candles) drawCandle(k, L.alpha);
        }
      }

      // ---- forming: traveling wave of growing candles ----
      else if (variant === 'forming') {
        const L = layers[0];
        const wave = (t * 0.5) % 1.6; // position of the forming wave
        L.candles.forEach((k, i) => {
          const p = i / L.candles.length;
          // distance from wave -> grow factor
          let g = 1;
          const d = Math.abs(p - (wave / 1.6));
          if (d < 0.12) g = 0.2 + (d / 0.12) * 0.8;        // near wave: shrunk (forming)
          drawCandle(k, 1, g);
        });
      }

      // ---- equity: faint candles breathing + glowing equity line ----
      else if (variant === 'equity') {
        const L = layers[0];
        for (const k of L.candles) {
          const breathe = 0.6 + 0.4 * Math.sin(t * 0.6 + k.phase * 6.28);
          drawCandle(k, 0.5 * breathe);
        }
        // equity line through closes
        ctx.beginPath();
        L.candles.forEach((k, i) => { const x = k.x, y = yOf(k.c); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(${GOLD},0.5)`; ctx.lineWidth = 2;
        ctx.shadowColor = `rgb(${GOLD})`; ctx.shadowBlur = 16; ctx.stroke(); ctx.shadowBlur = 0;
        // travelling dot
        const prog = (t * 0.12) % 1;
        const idx = Math.floor(prog * (L.candles.length - 1));
        const k = L.candles[idx]; if (k) {
          ctx.beginPath(); ctx.arc(k.x, yOf(k.c), 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${GOLD})`; ctx.shadowColor = `rgb(${GOLD})`; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
        }
      }

      // ---- scan: static faint candles + sweeping scan line lighting them up ----
      else if (variant === 'scan') {
        const L = layers[0];
        const scanX = ((t * 0.18) % 1.3 - 0.15) * w; // sweep across
        for (const k of L.candles) {
          const d = Math.abs(k.x - scanX);
          const lit = d < 70 ? 1 - d / 70 : 0;
          drawCandle(k, 0.28 + lit * 1.4);
        }
        // scan line
        ctx.globalAlpha = 1;
        const grad = ctx.createLinearGradient(scanX - 2, 0, scanX + 2, 0);
        grad.addColorStop(0, `rgba(${GOLD},0)`); grad.addColorStop(0.5, `rgba(${GOLD},0.6)`); grad.addColorStop(1, `rgba(${GOLD},0)`);
        ctx.fillStyle = grad; ctx.fillRect(scanX - 2, 0, 4, h);
      }

      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(render);
    };

    resize(); seed();
    if (reduce) render(performance.now());
    else raf = requestAnimationFrame(render);

    let lastW = window.innerWidth;
    const onResize = () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; resize(); seed(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [variant]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none',
        maskImage: 'radial-gradient(120% 90% at 42% 50%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 42% 50%, #000 30%, transparent 78%)',
      }}
    />
  );
}
