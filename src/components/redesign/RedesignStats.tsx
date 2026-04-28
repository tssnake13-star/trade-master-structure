import { useEffect, useRef, useState } from 'react';

/**
 * RedesignStats — editorial four-column stats strip.
 * Numbers and labels are NOT changed (mirror StatsCounter values exactly).
 * Layout: 4 columns separated by --rule-soft, top/bottom hairline borders.
 * Mobile: 2×2.
 */

const stats = [
  { value: 14, suffix: '', label: 'лет в рынке' },
  { value: 750, suffix: '+', label: 'эталонных сделок в архиве' },
  { value: 7, suffix: '–8:1', label: 'минимальный риск-реворд' },
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

const StatItem = ({
  value,
  suffix,
  label,
  animate,
  isLast,
}: {
  value: number;
  suffix: string;
  label: string;
  animate: boolean;
  isLast: boolean;
}) => {
  const count = useCountUp(value, 1500, animate);
  return (
    <div
      className="px-4 md:px-6 py-8 md:py-12"
      style={{
        borderRight: isLast ? 'none' : '1px solid hsl(var(--rule-soft))',
      }}
    >
      <div
        className="text-foreground"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 320,
          fontSize: 'clamp(48px, 5.5vw, 80px)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
        }}
      >
        {count}
        <em
          style={{
            fontStyle: 'italic',
            color: 'hsl(var(--warm))',
          }}
        >
          {suffix}
        </em>
      </div>
      <div
        className="mt-3"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'hsl(var(--muted-foreground))',
          opacity: 0.75,
          maxWidth: '22ch',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const RedesignStats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setAnimate(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-0">
      <div className="container-landing">
        <div
          style={{
            borderTop: '1px solid hsl(var(--rule-soft))',
            borderBottom: '1px solid hsl(var(--rule-soft))',
          }}
        >
          {/* Desktop: 4 cols */}
          <div className="hidden md:grid md:grid-cols-4">
            {stats.map((s, i) => (
              <StatItem
                key={i}
                {...s}
                animate={animate}
                isLast={i === stats.length - 1}
              />
            ))}
          </div>
          {/* Mobile: 2×2 */}
          <div className="grid grid-cols-2 md:hidden">
            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  borderRight:
                    i % 2 === 0 ? '1px solid hsl(var(--rule-soft))' : 'none',
                  borderBottom:
                    i < 2 ? '1px solid hsl(var(--rule-soft))' : 'none',
                }}
              >
                <StatItem {...s} animate={animate} isLast />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RedesignStats;