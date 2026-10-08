import { useEffect } from 'react';

const useScrollAnimate = () => {
  useEffect(() => {
    // ⚠️ Не возвращать threshold 0.1 (поймано Сергеем 08.10.2026: «с телефона не видно
    // некоторых блоков»). Высокая секция «Сотрудничество» на телефоне около 8000px, и 10%
    // её высоты больше экрана: наблюдатель не срабатывал, секция оставалась прозрачной.
    // Порог 0 с отступом снизу: секция проявляется, как только её верх прошёл 90% экрана.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );

    document.querySelectorAll('.section-animate').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
};

export default useScrollAnimate;
