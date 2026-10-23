import { useEffect, useRef, useState } from 'react';
import TerminalDemo, { CYCLE } from './TerminalDemo';
import { TerminalPainter, hslVar } from './terminalPaint';
import { createCurvedMonitor } from './monitorModel';

/**
 * Окно терминала «Недели по системе» на изогнутом мониторе (23.10.2026: проба ?3d с плоским монитором,
 * потом Сергей: «Ставь кольцо и монитор, монитор сделай изогнутым»). Терминал рисуется на холсте
 * (terminalPaint.ts) и ложится на экран 3D-модели (monitorModel.ts). Пока блок подъезжает снизу, монитор
 * развёрнут и наклонён и стоит дальше; к середине экрана он поворачивается лицом, на компьютере потом чуть
 * следует за мышью. Карточки недели под окном подсвечиваются в такт, как раньше (onPhase).
 * Без WebGL — прежнее окно TerminalDemo.
 */
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const DEG = Math.PI / 180;

export default function CurvedMonitor({ onPhase }: { onPhase?: (phase: number, progress: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    const el = box.current, canvas = cv.current;
    if (!el || !canvas) return;
    const cs = getComputedStyle(el);
    const v = (n: string) => hslVar(cs.getPropertyValue(n));
    const painter = new TerminalPainter({ border: v('--border'), card: v('--card'), accent: v('--accent'), muted: v('--muted-foreground'), fg: v('--foreground') });
    let mon: ReturnType<typeof createCurvedMonitor> = null;
    let aspect = 0, narrow: boolean | null = null, W = 0;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const layout = () => {
      W = el.clientWidth;
      if (!W) return;
      const isNarrow = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // картинка экрана — не плотнее 1,5: её перекладывают в видеокарту каждый кадр
      painter.layout(W, isNarrow, Math.min(dpr, 1.5));
      const a = painter.W / painter.H;
      if (!mon || narrow !== isNarrow || Math.abs(a - aspect) > 0.01) {
        mon?.dispose();
        mon = createCurvedMonitor(canvas, a, isNarrow);
        aspect = a; narrow = isNarrow;
        if (!mon) { setFlat(true); return; }
      }
      const H = Math.round(W * mon.ratio);
      canvas.style.height = `${H}px`;
      mon.resize(W, H, dpr);
      if (still) {
        const ph = painter.draw(15500, 0, 0);
        onPhase?.(ph.phase, ph.progress);
        mon.setTexture(painter.canvas);
        mon.draw({ rx: 4 * DEG, ry: -6 * DEG, push: 0 });
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    // шрифты окна (Martian Mono, Literata) могут прийти позже: перенос строк пересчитывается по настоящим
    if (document.fonts?.load) {
      Promise.all([document.fonts.load('10px "Martian Mono"'), document.fonts.load('13px Literata')]).then(layout).catch(() => {});
    }
    if (still) return () => { ro.disconnect(); mon?.dispose(); };

    let mx = 0, my = 0;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;
      mx = (ev.clientX / window.innerWidth) * 2 - 1;
      my = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    let visible = false;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(el);
    let raf = 0, last = 0, clock = 0, rx = 26, ry = -30, push = 0.9;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || !mon || !W) { last = 0; return; }
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      // неделя подписчика идёт, только пока монитор на экране; круги — покупка, потом продажа
      clock += dt * 1000;
      const ph = painter.draw(clock % CYCLE, Math.floor(clock / CYCLE) % 2, now / 1000);
      onPhase?.(ph.phase, ph.progress);
      mon.setTexture(painter.canvas);
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = ease(clamp((vh - r.top) / (vh * 0.5 + r.height * 0.5)));
      const q = clamp((vh / 2 - (r.top + r.height / 2)) / vh);
      const gX = (1 - p) * 26 - q * 8 + my * 4;
      const gY = (1 - p) * -30 + mx * 9 + Math.sin(now / 2600) * 1.5;
      const gP = (1 - p) * 0.9;
      const k = 1 - Math.exp(-dt / 0.18);
      rx += (gX - rx) * k; ry += (gY - ry) * k; push += (gP - push) * k;
      mon.draw({ rx: rx * DEG, ry: ry * DEG, push });
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      mon?.dispose();
    };
  }, [onPhase]);

  if (flat) return <TerminalDemo onPhase={onPhase} />;
  return (
    <div ref={box} className="cm">
      <canvas ref={cv} className="cm-canvas" aria-hidden="true" />
    </div>
  );
}
