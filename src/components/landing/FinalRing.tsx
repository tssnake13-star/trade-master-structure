import { useEffect, useRef } from 'react';

/**
 * Золотое кольцо последнего экрана («Первый шаг бесплатный»), по образцу Сергея
 * (финал сайта барбершопа: кресло на фоне светящегося кольца). 22.10.2026: «да, давай
 * последний экран». Кольцо прорисовывается, когда блок попадает на экран, потом живёт
 * без конца: вокруг плывут искры, свечение дышит.
 * 22.10.2026, Сергей про бегущие блики: «ужасно смотрится, надо заменить» → выбрал вариант
 * «7 делений — 7 дней»: кольцо из 7 дуг, они по очереди загораются по кругу (по 0,8 с),
 * когда горят все 7, кольцо вспыхивает целиком и гаснет, отсчёт идёт заново.
 * Намёк на 7 дней бесплатного терминала.
 *
 * ⚠️ 60 кадров: один canvas, свечение и блики нарисованы заранее (спрайты), в кадре их
 * только поворачивают; за краем экрана и в фоновой вкладке ничего не считается.
 * Центр кольца — середина элемента с атрибутом data-ring-center внутри секции.
 */

const ease = (t: number) => t * t * (3 - 2 * t);

type Spark = { a: number; r: number; v: number; s: number; ph: number };

function sprite(size: number, draw: (c: CanvasRenderingContext2D, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.max(2, Math.ceil(size));
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx, c.width / 2);
  return c;
}

export default function FinalRing() {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    const section = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !section || !ctx) return;

    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0, pad = 0;
    let ring: HTMLCanvasElement | null = null, segDim: HTMLCanvasElement | null = null;
    let segLit: HTMLCanvasElement | null = null, haze: HTMLCanvasElement | null = null, dot: HTMLCanvasElement | null = null;
    const SEG = (Math.PI * 2) / 7, GAP = 0.09;

    const glow = (c: CanvasRenderingContext2D, h: number, color: string, width: number, from: number, to: number, mul = 1) => {
      c.lineCap = 'butt';
      for (const [blur, alpha, w] of [[42, 0.45, width * 2.4], [16, 0.8, width * 1.3], [0, 1, width]] as const) {
        c.save();
        c.globalAlpha = alpha * mul;
        c.shadowColor = color; c.shadowBlur = blur * dpr;
        c.strokeStyle = color; c.lineWidth = w * dpr;
        c.beginPath(); c.arc(h, h, R * dpr, from, to); c.stroke();
        c.restore();
      }
    };

    const layout = () => {
      W = section.clientWidth; H = section.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const anchor = section.querySelector('[data-ring-center]') as HTMLElement | null;
      const sr = section.getBoundingClientRect();
      if (anchor) {
        const ar = anchor.getBoundingClientRect();
        cx = ar.left - sr.left + ar.width / 2; cy = ar.top - sr.top + ar.height / 2;
      } else { cx = W / 2; cy = H * 0.4; }
      R = Math.min(W * (W < 768 ? 0.44 : 0.3), 330);
      pad = 70;
      const size = (R + pad) * 2 * dpr;
      ring = sprite(size, (c, h) => glow(c, h, '#ffcf7a', 3.2, 0, Math.PI * 2));
      // 7 дуг: все тускло и одна яркая (её поворачивают на нужное место)
      segDim = sprite(size, (c, h) => {
        for (let i = 0; i < 7; i++) glow(c, h, '#ffcf7a', 3.2, -Math.PI / 2 + i * SEG + GAP / 2, -Math.PI / 2 + (i + 1) * SEG - GAP / 2, 0.28);
      });
      segLit = sprite(size, (c, h) => glow(c, h, '#ffd98f', 3.6, -Math.PI / 2 + GAP / 2, -Math.PI / 2 + SEG - GAP / 2));
      haze = sprite((R + pad * 2) * 2 * dpr, (c, h) => {
        const g = c.createRadialGradient(h, h, R * dpr * 0.2, h, h, h);
        g.addColorStop(0, 'rgba(243,177,79,0.10)'); g.addColorStop(0.55, 'rgba(243,177,79,0.16)');
        g.addColorStop(0.72, 'rgba(200,134,47,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(0, 0, h * 2, h * 2);
      });
      dot = sprite(24 * dpr, (c, h) => {
        const g = c.createRadialGradient(h, h, 0, h, h, h);
        g.addColorStop(0, 'rgba(255,224,170,1)'); g.addColorStop(0.35, 'rgba(255,224,170,0.5)'); g.addColorStop(1, 'rgba(255,224,170,0)');
        c.fillStyle = g; c.fillRect(0, 0, h * 2, h * 2);
      });
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(section);

    // искры кружат вокруг кольца и медленно поднимаются
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const sparks: Spark[] = Array.from({ length: 34 }, () => ({
      a: rnd() * Math.PI * 2, r: 0.7 + rnd() * 0.75, v: (rnd() - 0.5) * 0.12, s: 0.8 + rnd() * 1.8, ph: rnd() * 6.28,
    }));

    let shownAt = 0; // когда блок впервые попал на экран: с этого момента кольцо прорисовывается
    const draw = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!ring || !segDim || !segLit || !haze || !dot) return;
      const t = now / 1000;
      const k = Math.min(1, (now - shownAt) / 2200);
      const draw01 = k * k * (3 - 2 * k);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const box = (R + pad) * 2;

      // отсчёт: дуги загораются по одной, потом всё кольцо вспыхивает и гаснет
      const cyc = 7 * 0.8 + 2.2, u = ((now - shownAt) / 1000) % cyc;
      const lit = draw01 >= 1 ? Math.min(7, u / 0.8) : 0;
      const flash = draw01 >= 1 && u > 5.6 ? Math.sin(Math.min(1, (u - 5.6) / 2.2) * Math.PI) : 0;
      const fadeOut = u > 6.7 ? 1 - ease(Math.min(1, (u - 6.7) / 1.1)) : 1;

      ctx.globalAlpha = draw01 * (0.7 + 0.3 * flash);
      const hb = (R + pad * 2) * 2;
      ctx.drawImage(haze, cx - hb / 2, cy - hb / 2, hb, hb);

      // при появлении блока тусклые дуги прорисовываются по кругу
      ctx.save();
      ctx.globalAlpha = 1;
      if (draw01 < 1) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, box, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * draw01);
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(segDim, cx - box / 2, cy - box / 2, box, box);
      ctx.restore();

      for (let i = 0; i < 7; i++) {
        const a = Math.max(0, Math.min(1, lit - i)) * fadeOut;
        if (a <= 0) continue;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i * SEG);
        ctx.globalAlpha = ease(a) * (0.85 + 0.15 * flash);
        ctx.drawImage(segLit, -box / 2, -box / 2, box, box);
        ctx.restore();
      }
      if (flash > 0) {
        ctx.globalAlpha = flash * 0.6;
        ctx.drawImage(ring, cx - box / 2, cy - box / 2, box, box);
      }

      for (const s of sparks) {
        const a = s.a + t * s.v;
        const rise = ((t * 9 + s.ph * 40) % 160) - 80;
        const x = cx + Math.cos(a) * R * s.r;
        const y = cy + Math.sin(a) * R * s.r * 0.85 - rise * 0.4;
        ctx.globalAlpha = draw01 * (0.25 + 0.6 * Math.abs(Math.sin(t * 0.8 + s.ph)));
        const r = s.s * 2.6;
        ctx.drawImage(dot, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shownAt = -1e9;
      draw(performance.now());
      return () => ro.disconnect();
    }

    let visible = false;
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !shownAt) shownAt = performance.now();
    }, { threshold: 0.2 });
    io.observe(section);
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || !W) return;
      draw(now);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);

  return <canvas ref={cv} className="final-ring" aria-hidden="true" />;
}
