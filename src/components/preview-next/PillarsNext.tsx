import { Crosshair, ShieldCheck, GitBranch } from 'lucide-react';
import { KineticHeadline, SpotlightCard } from './primitives';

/**
 * PillarsNext — three spotlight cards (direction C) presenting the system's
 * core ideas. Border + fill glow follow the cursor; cards stagger-rise in.
 */
const PILLARS = [
  {
    icon: Crosshair,
    eyebrow: '01 · Алгоритм',
    title: 'Вход разрешает система',
    body: 'Чёткие условия допуска вместо «чуйки». Если сетап не проходит фильтр — сделки нет. Эмоция больше не нажимает на курок.',
  },
  {
    icon: ShieldCheck,
    eyebrow: '02 · Защита капитала',
    title: 'Риск считается заранее',
    body: 'Размер позиции, стоп и цель определены до входа. Просадка управляема, а не случайна — капитал переживает любую серию.',
  },
  {
    icon: GitBranch,
    eyebrow: '03 · Процесс решений',
    title: 'Повторяемый результат',
    body: 'Один и тот же путь принятия решения на каждой сделке. То, что повторяемо, — измеримо и улучшаемо. Так растёт винрейт.',
  },
];

export default function PillarsNext() {
  return (
    <section id="system" className="relative" style={{ zIndex: 2 }}>
      <div className="container-landing">
        <div className="section-label mb-5 pn-rise is-in">Trade OS · Ядро системы</div>
        <KineticHeadline
          as="h2"
          className="text-foreground mb-14 max-w-3xl"
          lines={[['Структура важнее ', { text: 'сигнала', gold: true }]]}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p, i) => (
            <SpotlightCard
              key={i}
              className="pn-rise is-in p-7 flex flex-col"
              style={{ ['--i' as string]: i, minHeight: 280 }}
            >
              <p.icon className="w-7 h-7 mb-6" style={{ color: 'hsl(var(--accent))' }} strokeWidth={1.5} />
              <div
                style={{
                  fontFamily: "'Martian Mono', monospace", fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'hsl(var(--muted-foreground) / 0.7)', marginBottom: 12,
                }}
              >
                {p.eyebrow}
              </div>
              <h3 className="text-foreground mb-3">{p.title}</h3>
              <p className="text-body" style={{ fontSize: 15, lineHeight: 1.6 }}>{p.body}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
