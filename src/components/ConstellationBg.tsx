import { useEffect, useRef } from 'react';

const ConstellationBg = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const N = 55;
    const nodes: {
      x: number; y: number;
      vx: number; vy: number;
      r: number; warm: boolean;
      phase: number;
    }[] = [];
    let w = 0, h = 0, animId = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initNodes() {
      nodes.length = 0;
      for (let i = 0; i < N; i++) {
        const warm = Math.random() < 0.35;
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          r: warm ? 2.2 : 1.6,
          warm,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(now: number) {
      ctx.clearRect(0, 0, w, h);
      const t = now * 0.001;

      // update positions
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      });

      // lines between near nodes (threshold 160px)
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const thresh = 160;
          if (dist < thresh) {
            const alpha = (1 - dist / thresh) * 0.10;
            const isWarm = a.warm || b.warm;
            ctx.strokeStyle = isWarm
              ? `oklch(0.78 0.09 70 / ${alpha})`
              : `oklch(0.72 0.07 230 / ${alpha * 1.2})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // dots with breathing pulse
      nodes.forEach(n => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.25 + n.phase);
        const alpha = 0.05 + pulse * 0.05;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulse * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = n.warm
          ? `oklch(0.78 0.09 70 / ${alpha})`
          : `oklch(0.72 0.07 230 / ${alpha * 0.85})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    initNodes();

    let lastW = window.innerWidth;
    let resizeTimer: number | undefined;
    const onResize = () => {
      // Ignore height-only changes (mobile address bar show/hide)
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        initNodes();
      }, 200);
    };
    window.addEventListener('resize', onResize);
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default ConstellationBg;