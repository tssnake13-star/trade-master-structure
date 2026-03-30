import { useState, useEffect, useRef } from 'react';

const stats = [
  { value: 14, suffix: '', label: 'лет в рынке' },
  { value: 1000, suffix: '+', label: 'эталонных сделок в архиве' },
  { value: 10, suffix: ':1', label: 'минимальный риск-реворд' },
  { value: 6, suffix: '–7', label: 'сделок из 15–18 сигналов/мес' },
];

const useCountUp = (end: number, duration = 1500, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
};

const StatItem = ({ value, suffix, label, animate }: { value: number; suffix: string; label: string; animate: boolean }) => {
  const count = useCountUp(value, 1500, animate);
  return (
    <div className="text-center py-4 md:py-0">
      <div className="text-2xl md:text-4xl font-bold text-foreground">
        {count}{suffix}
      </div>
      <div className="mt-1 text-xs md:text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

const StatsCounter = () => {
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

  return (
    <section ref={ref} className="py-8 md:py-12 border-y border-border bg-card/30">
      <div className="container-landing">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((s, i) => (
            <StatItem key={i} {...s} animate={animate} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
