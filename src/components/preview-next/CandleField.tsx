import { useEffect, useRef } from 'react';

/**
 * CandleField — faint, monochrome-gold candlestick field for the v3 hero that
 * continuously scrolls right-to-left like a live tape. Sits BEHIND the giant
 * headline as moving texture. New candles are generated on the right as old
 * ones leave on the left. Masked to fade at the edges; pauses under
 * reduced-motion (draws a single static frame).
 */
type C = { x: number; o: number; c: number; hi: number; lo: number };

export default function CandleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1, raf = 0;
    const STEP = 34;            // px between candles
    const CW = 15;              // candle body width
    const SPEED = 0.35;         // px per frame (slow, premium drift)
    let candles: C[] = [];
    let last = 0.5;            // last close, drives the next candle

    const mkClose = (prev: number) => {
      const vol = 0.04 + Math.random() * 0.08;
      const dir = Math.random() < 0.5 ? 1 : -1;
      return Math.max(0.08, Math.min(0.92, prev + dir * vol));
    };
    const pushCandle = (x: number) => {
      const o = last;
      const c = mkClose(o);
      last = c;
      candles.push({ x, o, c, hi: Math.max(o, c) + Math.random() * 0.06, lo: Math.min(o, c) - Math.random() * 0.06 });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      candles = [];
      last = 0.5;
      for (let x = -STEP; x < w + STEP * 2; x += STEP) pushCandle(x);
    };

    const yOf = (v: number) => h * 0.1 + (1 - v) * h * 0.8;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const k of candles) {
        const up = k.c >= k.o;
        ctx.globalAlpha = up ? 0.18 : 0.10;
        ctx.strokeStyle = 'rgba(202,164,114,1)';
        ctx.fillStyle = 'rgba(202,164,114,1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(k.x, yOf(k.hi)); ctx.lineTo(k.x, yOf(k.lo)); ctx.stroke();
        const top = Math.min(yOf(k.o), yOf(k.c));
        const bh = Math.max(2, Math.abs(yOf(k.c) - yOf(k.o)));
        ctx.fillRect(k.x - CW / 2, top, CW, bh);
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      for (const k of candles) k.x -= SPEED;
      // recycle: drop off-screen-left, append on the right
      while (candles.length && candles[0].x < -STEP * 2) candles.shift();
      const rightmost = candles.length ? candles[candles.length - 1].x : 0;
      if (rightmost < w + STEP) pushCandle(rightmost + STEP);
      render();
      raf = requestAnimationFrame(tick);
    };

    resize();
    seed();
    if (reduce) { render(); }
    else raf = requestAnimationFrame(tick);

    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      resize(); seed(); render();
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        maskImage: 'radial-gradient(120% 90% at 42% 50%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 42% 50%, #000 30%, transparent 78%)',
      }}
    />
  );
}
