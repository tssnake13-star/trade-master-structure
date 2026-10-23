import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Окно терминала монитором в объёме — проба 3D по адресу с ?3d (23.10.2026). Сергей: «я хочу 3D-сайт…
 * 3D-модели». Живое окно TerminalDemo стоит в корпусе с толщиной, задней крышкой и бликом стекла.
 * Пока блок подъезжает снизу, монитор развёрнут и наклонён и лежит дальше; к середине экрана он
 * поворачивается к зрителю лицом. Дальше на компьютере чуть следует за мышью, на телефоне — за прокруткой.
 * CSS 3D, без библиотек: терминал остаётся живым и чётким, как в обычной версии.
 */
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export default function Monitor3D({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    const rig = el?.querySelector<HTMLElement>('.m3d-rig');
    const shadow = el?.querySelector<HTMLElement>('.m3d-shadow');
    if (!el || !rig || !shadow) return;
    const put = (rx: number, ry: number, tz: number) => {
      rig.style.transform = `translateZ(${tz.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      rig.style.setProperty('--gx', `${(50 - ry * 2.2).toFixed(1)}%`);
      shadow.style.transform = `scaleX(${(0.86 + Math.cos((ry * Math.PI) / 180) * 0.1).toFixed(3)})`;
      shadow.style.opacity = (0.45 + 0.4 * (1 - Math.abs(rx) / 30)).toFixed(3);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { put(4, -6, 0); return; }

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
    let raf = 0, last = 0, rx = 30, ry = -28, tz = -220;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // p: 0 — монитор только показался снизу, 1 — его центр на середине экрана; q — ушёл выше середины
      const mid = r.top + r.height / 2;
      const p = ease(clamp((vh - r.top) / (vh * 0.5 + r.height * 0.5)));
      const q = clamp((vh / 2 - mid) / vh);
      const goalX = (1 - p) * 30 - q * 10 - my * 4;
      const goalY = (1 - p) * -28 + mx * 7 + Math.sin(now / 2600) * 1.2;
      const goalZ = (1 - p) * -220;
      const k = 1 - Math.exp(-dt / 0.18);
      rx += (goalX - rx) * k; ry += (goalY - ry) * k; tz += (goalZ - tz) * k;
      put(rx, ry, tz);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('pointermove', onMove); };
  }, []);

  return (
    <div ref={stage} className="m3d">
      <div className="m3d-rig">
        <div className="m3d-back" aria-hidden="true" />
        <div className="m3d-side m3d-side--l" aria-hidden="true" />
        <div className="m3d-side m3d-side--r" aria-hidden="true" />
        <div className="m3d-side m3d-side--t" aria-hidden="true" />
        <div className="m3d-side m3d-side--b" aria-hidden="true" />
        <div className="m3d-screen">
          {children}
          <div className="m3d-glare" aria-hidden="true" />
        </div>
      </div>
      <div className="m3d-shadow" aria-hidden="true" />
    </div>
  );
}
