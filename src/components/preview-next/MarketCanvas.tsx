import { useEffect, useRef } from 'react';

/**
 * MarketCanvas — a single, quiet "equity curve" for the hero band.
 *
 * One smooth rising line that draws itself in left-to-right on mount, with a
 * soft gold area fill underneath and a glowing head dot. No candles, no
 * perpetual rAF: it animates in once, then paints a final static frame (the
 * "live" feel comes from the global AuroraField). Honors reduced-motion.
 */
const WARM = 'rgba(202, 164, 114, 1)';

export default function MarketCanvas({ fade = 'vertical' }: { fade?: 'vertical' | 'horizontal' | 'none' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, raf = 0, dpr = 1;
    const N = 160;
    const vals: number[] = [];

    // Smooth, organically-rising curve: upward trend + a couple of gentle
    // sine waves + a small early dip, so it reads as "growth" not noise.
    function build() {
      vals.length = 0;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const trend = 0.22 + t * 0.52;
        const wave = Math.sin(t * Math.PI * 2.2) * 0.05 + Math.sin(t * Math.PI * 5.5) * 0.022;
        const dip = -Math.exp(-Math.pow((t - 0.18) / 0.10, 2)) * 0.06;
        vals.push(Math.max(0.06, Math.min(0.94, trend + wave + dip)));
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const padX = () => w * 0.04;
    const xOf = (i: number) => padX() + (w - padX() * 2) * (i / (N - 1));
    const yOf = (v: number) => h - h * 0.16 - v * (h * 0.66);

    function draw(progress: number) {
      ctx!.clearRect(0, 0, w, h);
      const head = Math.max(1, Math.floor(progress * (N - 1)));

      // area fill under the drawn portion
      ctx!.beginPath();
      ctx!.moveTo(xOf(0), yOf(vals[0]));
      for (let i = 1; i <= head; i++) ctx!.lineTo(xOf(i), yOf(vals[i]));
      ctx!.lineTo(xOf(head), h);
      ctx!.lineTo(xOf(0), h);
      ctx!.closePath();
      const grad = ctx!.createLinearGradient(0, yOf(0.94), 0, h);
      grad.addColorStop(0, 'rgba(202,164,114,0.16)');
      grad.addColorStop(1, 'rgba(202,164,114,0)');
      ctx!.fillStyle = grad;
      ctx!.fill();

      // the line itself, with glow
      ctx!.beginPath();
      ctx!.moveTo(xOf(0), yOf(vals[0]));
      for (let i = 1; i <= head; i++) ctx!.lineTo(xOf(i), yOf(vals[i]));
      ctx!.strokeStyle = WARM;
      ctx!.lineWidth = 1.8;
      ctx!.lineJoin = 'round';
      ctx!.shadowColor = WARM;
      ctx!.shadowBlur = 14;
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // head dot
      const hx = xOf(head), hy = yOf(vals[head]);
      ctx!.beginPath();
      ctx!.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx!.fillStyle = 'rgba(202,164,114,0.18)';
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(hx, hy, 2.6, 0, Math.PI * 2);
      ctx!.fillStyle = WARM;
      ctx!.fill();
    }

    resize();
    build();

    if (reduce) {
      draw(1);
    } else {
      const start = performance.now();
      const dur = 1800;
      const loop = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        draw(eased);
        if (p < 1) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      resize();
      build();
      draw(1);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const mask =
    fade === 'horizontal'
      ? 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)'
      : fade === 'vertical'
        ? 'linear-gradient(to bottom, transparent, #000 18%, #000 78%, transparent)'
        : 'none';

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
