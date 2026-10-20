import { useState, useEffect, useRef } from 'react';
import { AUTHOR_STATS } from '@/lib/authorStats';

// 20.10.2026: список — в lib/authorStats.ts (Win Rate и R:R — таблица счёта, см. там)
const stats = AUTHOR_STATS;


// Начальное значение — итоговое число, а не 0: версию для роботов и ИИ сайт рендерит
// на сервере, анимация там не запускается, и до 04.10.2026 они читали «0 лет в рынке»,
// «0% Win Rate». В браузере отсчёт с нуля начинается, когда блок попадает на экран.
const useCountUp = (end: number, duration = 1500, start = false, decimals = 0) => {
  const [count, setCount] = useState(end);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const k = 10 ** decimals;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end * k) / k);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start, decimals]);
  return count;
};

const StatItem = ({ value, suffix, label, animate, decimals = 0, compact = false }: { value: number; suffix: string; label: string; animate: boolean; decimals?: number; compact?: boolean }) => {
  const count = useCountUp(value, 1500, animate, decimals);
  return (
    <div className={compact ? 'py-2 md:py-0' : 'text-center py-4 md:py-0'}>
      {/* в блоке «Автор» колонки уже: цифра мельче, чтобы «1000+» не вылезала за колонку */}
      <div className="stat-number text-foreground" style={compact ? { fontSize: 'clamp(36px, 4.2vw, 60px)' } : undefined}>
        {count.toFixed(decimals).replace('.', ',')}{suffix}
      </div>
      <div className="stat-label text-muted-foreground">{label}</div>
    </div>
  );
};

/**
 * 11.10.2026: полоса стояла под первым экраном и повторяла его и «Результаты».
 * Сергей: «перемести их тогда в блок автор». embedded — вариант внутри блока «Автор»,
 * без своей секции и рамки на всю ширину.
 */
const StatsCounter = ({ embedded = false }: { embedded?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const grid = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
      {stats.map((s, i) => (
        <StatItem key={i} {...s} animate={animate} compact={embedded} />
      ))}
    </div>
  );

  if (embedded) {
    return (
      <div ref={ref} className="mt-10 md:mt-12 pt-8 border-t border-border">
        {grid}
      </div>
    );
  }

  return (
    <section ref={ref} className="py-8 md:py-12 border-y border-border bg-card/30">
      <div className="container-landing">{grid}</div>
    </section>
  );
};

export default StatsCounter;
