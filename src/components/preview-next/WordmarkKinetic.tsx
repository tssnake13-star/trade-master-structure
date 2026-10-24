import { useEffect, useRef } from 'react';

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const BAND = 2.4; // ширина блика, в буквах
const PASSES = 2; // проходов блика, пока фраза подъезжает к середине экрана

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
        // u: +1 — фраза ниже середины экрана, 0 — в середине, −1 — выше; при прокрутке вниз u только убывает
        const u = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh * 0.7)));
        // 24.10.2026, Сергей: «анимация крупных словосочетаний должна подсвечивать все буквы» — и в тот же день:
        // «ты их зажёг, и всё, никакой анимации… раньше переливались… в середине зажигается полностью, потом,
        // когда листаешь дальше, начинает переливаться заново». По фразе бежит блик — полоса в несколько букв:
        // буква загорается и подпрыгивает, потом гаснет; пока фраза подъезжает к середине экрана, блик проходит
        // её дважды. У середины горит вся фраза, дальше блик бежит снова.
        const n = letters.length;
        const full = ease(clamp01((0.26 - Math.abs(u)) / 0.18));
        const amp = 0.55 + 0.45 * (1 - Math.abs(u));
        const pass = ((1 - u) * PASSES) % 1;
        const s = pass * (n - 1 + 4 * BAND) - 2 * BAND;
        letters.forEach((ltr, i) => {
          const wave = Math.exp(-(((i - s) / BAND) ** 2));
          const lit = Math.max(full, amp * wave);
          const lift = 14 * amp * wave * (1 - full);
          ltr.style.transform = `translateY(${(-lift).toFixed(1)}px)`;
          ltr.style.color = lit > 0.02 ? `hsl(var(--accent) / ${(0.3 + 0.5 * lit).toFixed(2)})` : '';
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
