import { CountUp, KineticHeadline, useInView } from './primitives';

/**
 * StatsNext — counter strip with count-up numbers that fire on scroll.
 * Demonstrates the "market table" number motion (direction A).
 */
const STATS: { to: number; suffix?: string; prefix?: string; decimals?: number; label: string }[] = [
  { to: 1200, suffix: '+', label: 'Учеников в системе' },
  { to: 5.0, decimals: 1, label: 'Версия Trade Master' },
  { to: 68, suffix: '%', label: 'Винрейт по системе' },
  { to: 6, label: 'Лет на рынке' },
];

export default function StatsNext() {
  const ref = useInView<HTMLDivElement>(0.2);
  return (
    <section id="stats" className="relative" style={{ zIndex: 2 }}>
      <div className="container-landing">
        <KineticHeadline
          as="h2"
          className="text-foreground mb-14 max-w-3xl"
          lines={[['Цифры, которые ', { text: 'считает система', gold: true }]]}
        />
        <div
          ref={ref}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: 'hsl(var(--rule-soft))', border: '1px solid hsl(var(--rule-soft))' }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className="pn-rise is-in"
              style={{
                ['--i' as string]: i,
                background: 'hsl(var(--background))',
                padding: '36px 28px',
              }}
            >
              <div className="stat-number text-foreground">
                <CountUp to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
