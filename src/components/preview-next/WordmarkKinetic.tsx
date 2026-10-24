import { useEffect, useRef } from 'react';

/**
 * WordmarkKinetic — oversized editorial wordmark (direction B) whose letters
 * lift in a travelling wave as the divider crosses the viewport center.
 * Scroll-driven via rAF; reduced-motion shows it static.
 */
export default function WordmarkKinetic({
  text, emphasis,
}: { text: string; emphasis?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const letters = Array.from(el.querySelectorAll<HTMLElement>('.pn-wm-letter'));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when divider center is far, 1 when at viewport center
        const center = r.top + r.height / 2;
        const prox = 1 - Math.min(1, Math.abs(center - vh / 2) / (vh * 0.7));
        // 24.10.2026, Сергей: «анимация крупных словосочетаний должна подсвечивать все буквы». Прежняя волна
        // со сдвигом 0,35 рад на букву доходила только до первых восьми-девяти букв. Теперь фронт проходит всю
        // фразу слева направо, пока она подъезжает к середине экрана: буква подпрыгивает, загорается и остаётся
        // гореть; у середины горит вся фраза, уходя — гаснет в обратном порядке.
        const n = letters.length;
        letters.forEach((ltr, i) => {
          const at = 0.25 + 0.5 * (n > 1 ? i / (n - 1) : 0);
          const lit = Math.max(0, Math.min(1, (prox - at + 0.12) / 0.24));
          const hop = Math.exp(-(((prox - at) / 0.09) ** 2));
          ltr.style.transform = `translateY(${(-hop * 16).toFixed(1)}px)`;
          ltr.style.color = lit > 0.01 ? `hsl(var(--accent) / ${(0.3 + 0.5 * lit).toFixed(2)})` : '';
        });
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const split = (s: string) =>
    Array.from(s).map((ch, i) => (
      <span className="pn-wm-letter" key={i}>{ch === ' ' ? ' ' : ch}</span>
    ));

  return (
    <div ref={ref} className="py-20 md:py-28 overflow-hidden relative" style={{ zIndex: 2 }}>
      <div className="pn-wordmark">
        {split(text)}
        {emphasis && <em>{split(emphasis)}</em>}
      </div>
    </div>
  );
}
