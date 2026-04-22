const tactics = [
  {
    id: 'archive',
    step: 'Тактика 1',
    name: 'Архив / H4',
    description: 'Вход через память рынка. Геометрическое совпадение с паттернами архива.',
  },
  {
    id: 'resonance',
    step: 'Тактика 2',
    name: 'Резонанс / H1',
    description: 'Вход через состояние рынка. Сканирование валютного резонанса на импульс.',
  },
];

const flows = [
  {
    id: 'archive-path',
    nodes: [
      {
        step: 'Шаг 1',
        name: 'Trend Hunter',
        description: 'Сканирует H4, ищет триггер точки входа и отправляет сигнал дальше.',
      },
      {
        step: 'Шаг 2',
        name: 'Echo Gate',
        description: 'Фильтрует триггер по архиву сделок, геометрии и контексту W1 / D1. Результат: допуск или отказ.',
      },
      {
        step: 'Шаг 3',
        name: 'Трейдер',
        description: 'Получает допуск и принимает финальное решение по сделке.',
      },
    ],
  },
  {
    id: 'resonance-path',
    nodes: [
      {
        step: 'Шаг 1',
        name: 'Resonance Scanner',
        description: 'Сканирует инструменты и формирует топ по резонансу W1 / D1.',
        badge: '1.5x — 4.6x импульс',
      },
      {
        step: 'Шаг 2',
        name: 'Трейдер',
        description: 'Изучает топ инструментов, проверяет их по общей стратегии и принимает финальное решение.',
      },
    ],
  },
];

const sharedNodes = [
  {
    step: 'Автоисполнение',
    name: 'HunterBot v12.3',
    description: 'Открывает сделку по распоряжению трейдера.',
  },
  {
    step: 'Защита счёта',
    name: 'Risk Sentinel',
    description: 'Контроль лимитов, Pyramid Gate и блокировка при превышении риска.',
  },
];

const stats = [
  { value: 'H4', label: 'Таймфрейм сигнала', sublabel: 'Тактика 1 — Архив' },
  { value: 'H1', label: 'Таймфрейм триггера', sublabel: 'Тактика 2 — Резонанс' },
  { value: '8:1+', label: 'R:R резонансных сделок', sublabel: 'наблюдение апрель 2026' },
];

const ArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-muted-foreground/40">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

const TradingSystemSection = () => {

  return (
    <section className="py-16 md:py-24 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          <h2 className="heading-section text-foreground mb-4">
            Как работает система изнутри
          </h2>
          <div className="mt-10 md:mt-14 rounded-2xl border border-border bg-card p-5 md:p-8 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '36px 36px',
              }}
            />

            <div className="relative z-10">
              <p className="text-sm md:text-base text-muted-foreground mb-8 md:mb-10">
                Две тактики, одна экосистема и единый контур контроля риска.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                {tactics.map((tactic) => (
                  <div key={tactic.id} className="rounded-xl border border-border bg-background/40 px-4 py-4 md:px-5 md:py-5">
                    <div className="text-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70 mb-2">
                      {tactic.step}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-foreground leading-tight">
                      {tactic.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                      {tactic.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {flows.map((flow) => (
                  <div key={flow.id} className="flex flex-col items-center">
                    {flow.nodes.map((node, index) => (
                      <div key={node.name} className="w-full flex flex-col items-center">
                        <div className="w-full rounded-xl border border-border bg-background/40 p-4 md:p-5">
                          <div className="text-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70 mb-2">
                            {node.step}
                          </div>
                          <h4 className="text-base md:text-lg font-semibold text-foreground leading-tight">
                            {node.name}
                          </h4>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {node.description}
                          </p>
                          {node.badge && (
                            <span className="mt-3 inline-flex rounded-full border border-border px-3 py-1 text-[11px] text-foreground/70">
                              {node.badge}
                            </span>
                          )}
                        </div>
                        {index < flow.nodes.length - 1 && (
                          <div className="flex h-8 items-center justify-center">
                            <ArrowDown />
                          </div>
                        )}
                      </div>
                    ))}
                    {flow.nodes.length < 3 && <div className="hidden md:block h-[132px]" />}
                  </div>
                ))}
              </div>

              <div className="mt-6 md:mt-8 hidden md:grid grid-cols-2 gap-6 h-8">
                <div className="ml-[50%] border-r border-b border-border" />
                <div className="mr-[50%] border-l border-b border-border" />
              </div>

              <div className="mt-4 md:mt-0 flex flex-col items-center">
                <div className="flex h-8 items-center justify-center">
                  <ArrowDown />
                </div>
                <div className="mb-4 flex items-center justify-center gap-3 text-center text-mono text-[10px] uppercase tracking-[0.28em] text-foreground/70">
                  <span className="h-px w-10 bg-border md:w-28" />
                  Единый путь исполнения
                  <span className="h-px w-10 bg-border md:w-28" />
                </div>

                <div className="w-full max-w-2xl space-y-3">
                  {sharedNodes.map((node, index) => (
                    <div key={node.name} className="flex flex-col items-center">
                      <div className="w-full rounded-xl border border-border bg-background/40 p-4 md:p-5">
                        <div className="text-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70 mb-2">
                          {node.step}
                        </div>
                        <h4 className="text-base md:text-lg font-semibold text-foreground leading-tight">
                          {node.name}
                        </h4>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                      {index < sharedNodes.length - 1 && (
                        <div className="flex h-8 items-center justify-center">
                          <ArrowDown />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div key={stat.value} className="rounded-xl border border-border bg-background/40 p-4 text-center">
                    <div className="text-2xl md:text-3xl font-semibold text-foreground leading-none">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm text-foreground/80 leading-snug">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {stat.sublabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradingSystemSection;
