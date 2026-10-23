import { useEffect, useLayoutEffect } from 'react';
import { V5 } from '@/lib/lookV5';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Текст и одиночные блоки раздела, которые проявляются мягко снизу (роль «up»).
const TEXT_SEL = 'p, h3, h4, ul, ol, blockquote, figure, .smv, a, button';

/**
 * Хореография главной (23.10.2026). Сергей: «полный апгрейд сайта по анимации, чтобы анимация
 * была дорогая, выглядела дорого, с эффектом вау».
 *
 * Раздел больше не проявляется целиком: подпись, заголовок по словам, текст, карточки по очереди.
 * Здесь только разметка ролей (data-fx) и запуск, как это выглядит — в styles/fx.css.
 * Первый экран и последний (кольцо) не трогаем: у них своя анимация.
 *
 * Безопасность:
 * — класс fx-on ставится до первой отрисовки (layout effect), без него всё видно как раньше;
 *   боты получают страницу без него;
 * — при системной настройке «меньше движения» ничего не прячется и ничего не бегает;
 * — после проявления элемент возвращается к своим стилям (data-fx снимается), поэтому наведение
 *   и переходы карточек работают как раньше;
 * — лучи по рамке и свет на кнопке стоят, пока их не видно.
 */
export default function useLandingFx() {
  useIsoLayoutEffect(() => {
    const main = document.querySelector<HTMLElement>('.v3-skin main');
    if (!main) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // облик, шаг 4 (проба ?v5): ниже первого экрана ничего не появляется и не бегает само
    if (V5) return;
    const html = document.documentElement;
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    html.classList.add('fx-on');
    if (hover) html.classList.add('fx-hover');

    const roles: HTMLElement[] = [];
    const injected: HTMLElement[] = [];
    const timers: number[] = [];
    const inMarked = (el: Element) => !!el.parentElement?.closest('[data-fx]');
    const mark = (el: HTMLElement, role: string) => {
      if (el.dataset.fx || inMarked(el)) return;
      el.dataset.fx = role;
      roles.push(el);
    };
    const inject = (host: HTMLElement, cls: string) => {
      if (host.querySelector(`:scope > .${cls}`)) return null;
      const s = document.createElement('span');
      s.className = cls;
      s.setAttribute('aria-hidden', 'true');
      host.appendChild(s);
      injected.push(s);
      return s;
    };

    const sections = Array.from(main.querySelectorAll<HTMLElement>(':scope > section')).filter(
      (s) => !s.querySelector('h1') && !s.classList.contains('final-cta'),
    );
    for (const sec of sections) {
      sec.querySelectorAll<HTMLElement>('[data-fx]').forEach((el) => roles.push(el)); // размечено в JSX
      sec.querySelectorAll<HTMLElement>('.section-label').forEach((el) => mark(el, 'label'));
      sec.querySelectorAll<HTMLElement>('h2').forEach((el) => mark(el, el.querySelector('.fx-word') ? 'h' : 'up'));
      if (sec.id === 'author') {
        const img = sec.querySelector('img');
        if (img?.parentElement) mark(img.parentElement, 'photo');
      }
      sec.querySelectorAll<HTMLElement>('.grid').forEach((g) => {
        if (g.dataset.fx || inMarked(g)) return;
        Array.from(g.children).forEach((c) => mark(c as HTMLElement, 'card'));
      });
      // плашки в рамке (цена пропуска, примечания) — целиком, вместе с текстом
      sec.querySelectorAll<HTMLElement>('div.border, div[style*="border:"]').forEach((b) => {
        if (b.querySelector('h2, .grid, [data-fx]')) return;
        mark(b, 'up');
      });
      sec.querySelectorAll<HTMLElement>(TEXT_SEL).forEach((el) => mark(el, 'up'));
    }

    // цифры: один блик вместо отсчёта с нуля
    main.querySelectorAll<HTMLElement>('#stats .tabular-nums, #author .stat-number').forEach((n) => { n.dataset.shine = ''; });
    // графики сделок: по картинке один раз проходит линия скана
    main.querySelectorAll<HTMLElement>('#trades button img').forEach((img) => {
      if (img.parentElement) img.parentElement.dataset.scan = '';
    });

    // ---- проявление: всё, что вошло в экран одновременно, идёт по очереди ----
    let batchAt = 0;
    let batchK = 0;
    const reveal = (el: HTMLElement, d: number) => {
      el.dataset.in = '';
      el.querySelectorAll<HTMLElement>('[data-scan], [data-shine]').forEach((s) => {
        s.style.setProperty('--sd', `${d + 380}ms`);
        if (s.hasAttribute('data-scan')) s.dataset.scanning = '';
        else s.dataset.shining = '';
      });
      const role = el.dataset.fx;
      const words = role === 'h' || role === 'quote' ? el.querySelectorAll('.fx-word').length : 0;
      const step = role === 'quote' ? 75 : 45;
      const total = d + words * step + (role === 'photo' ? 2600 : role === 'lamp' ? 2200 : 1500);
      timers.push(
        window.setTimeout(() => {
          delete el.dataset.fx;
          delete el.dataset.in;
          el.style.removeProperty('--d');
        }, total),
      );
    };
    const io = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        if (now - batchAt > 150) batchK = 0;
        batchAt = now;
        entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .forEach((el) => {
            const d = Math.min(batchK++, 8) * 70;
            el.style.setProperty('--d', `${d}ms`);
            io.unobserve(el);
            reveal(el, d);
          });
      },
      { rootMargin: '0px 0px -2% 0px', threshold: 0 },
    );
    roles.forEach((el) => io.observe(el));

    // ---- лучи по рамке главных карточек и свет по кругу на главной кнопке ----
    const loops = Array.from(document.querySelectorAll<HTMLElement>('[data-beam], [data-orbit]'));
    loops.forEach((host) => {
      const s = inject(host, host.hasAttribute('data-beam') ? 'fx-beam' : 'fx-orbit');
      if (!s) return;
      const r = host.getBoundingClientRect();
      s.style.setProperty('--bs', `${Math.ceil(Math.hypot(r.width, r.height) * 1.15)}px`);
    });
    const loopIo = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        const t = e.target as HTMLElement;
        if (e.isIntersecting) t.dataset.vis = '';
        else delete t.dataset.vis;
      }),
    );
    loops.forEach((h) => loopIo.observe(h));

    // ---- свет за курсором на карточках (только мышь) ----
    let raf = 0;
    let px = 0;
    let py = 0;
    let target: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      target = (e.target as Element | null)?.closest?.('[data-spot]') as HTMLElement | null;
      if (raf || !target) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!target) return;
        const r = target.getBoundingClientRect();
        target.style.setProperty('--mx', `${Math.round(px - r.left)}px`);
        target.style.setProperty('--my', `${Math.round(py - r.top)}px`);
      });
    };
    const spots: HTMLElement[] = [];
    if (hover) {
      main.querySelectorAll<HTMLElement>('[data-fx="card"], [data-beam]').forEach((c) => {
        if (parseFloat(getComputedStyle(c).borderTopWidth) <= 0 && !c.hasAttribute('data-beam')) return;
        c.dataset.spot = '';
        spots.push(c);
        inject(c, 'fx-spot');
      });
      document.addEventListener('pointermove', onMove, { passive: true });
    }

    return () => {
      io.disconnect();
      loopIo.disconnect();
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      injected.forEach((s) => s.remove());
      roles.forEach((el) => {
        delete el.dataset.fx;
        delete el.dataset.in;
        el.style.removeProperty('--d');
      });
      spots.forEach((c) => delete c.dataset.spot);
      html.classList.remove('fx-on', 'fx-hover');
    };
  }, []);
}
