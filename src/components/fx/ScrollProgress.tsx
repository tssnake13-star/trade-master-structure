import { useEffect, useRef } from 'react';

/**
 * Тонкая золотая полоса вверху экрана: сколько страницы прочитано (23.10.2026, по мотивам
 * Magic UI «Scroll Progress»). Появляется после первого экрана. Пишем в стиль только то,
 * что изменилось: на планшете каждая лишняя запись стоит кадров.
 */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let lastP = '';
    let lastShow = '';
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0';
      const show = window.scrollY > window.innerHeight * 0.5 ? '1' : '0';
      if (p !== lastP) { el.style.transform = `scaleX(${p})`; lastP = p; }
      if (show !== lastShow) { el.style.opacity = show; lastShow = show; }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="fx-progress" aria-hidden="true" />;
}
