import { useEffect } from 'react';

/**
 * Adds .is-visible to any element with class .reveal once it enters the viewport.
 * One-shot per element. Cheap and idempotent — safe to mount once on a page.
 */
const useReveal = (rootSelector = '.reveal') => {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(rootSelector));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootSelector]);
};

export default useReveal;