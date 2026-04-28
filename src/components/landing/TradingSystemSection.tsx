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
    name: 'Hunter Bot',
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
  { value: '8:1+', label: 'R:R резонансных сделок', sublabel: 'наблюдение с июня 2020' },
];

const ArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-muted-foreground/40">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

const TacticCard = ({ tactic }: { tactic: (typeof tactics)[number] }) => (
  <div className="rounded-xl px-4 py-5 md:px-5 md:py-5 relative overflow-hidden bg-card border border-border shadow-[0_8px_28px_-10px_hsl(36_29%_40%/0.45)] border-l-2 border-l-accent/60 md:border-l md:border-l-border">
    <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-foreground/30 to-transparent" />
    <div className="text-mono text-[10px] uppercase tracking-[0.3em] mb-2 text-accent/80 md:text-muted-foreground">
      {tactic.step}
    </div>
    <h3 className="text-lg md:text-xl font-semibold leading-tight" style={{ color: 'hsl(36 29% 40%)' }}>
      {tactic.name}
    </h3>
    <p className="mt-2 text-sm leading-relaxed max-w-md text-muted-foreground">
      {tactic.description}
    </p>
  </div>
);

const FlowCard = ({ node }: { node: (typeof flows)[number]['nodes'][number] }) => (
  <div className="w-full rounded-xl p-4 md:p-5 bg-card border border-border">
    <div className="text-mono text-[10px] uppercase tracking-[0.24em] mb-2 text-muted-foreground">
      {node.step}
    </div>
    <h4 className="text-base md:text-lg font-semibold leading-tight text-foreground">
      {node.name}
    </h4>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      {node.description}
    </p>
    {node.badge && (
      <span className="mt-3 inline-flex rounded-full px-3 py-1 text-mono text-[10px] text-foreground/70 border border-foreground/15 bg-foreground/[0.04]">
        {node.badge}
      </span>
    )}
  </div>
);

const TradingSystemSection = () => {

  return (
    <section id="trading-system" className="py-16 md:py-24 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          <span className="section-label">011 · Архитектура</span>
          <h2 className="text-foreground mb-4">
            Как работает <em>система</em> <span className="mute">изнутри</span>
          </h2>
          <div className="mt-10 md:mt-14 rounded-2xl p-5 md:p-8 relative overflow-hidden bg-card/50 border border-border">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10">
              <div className="mb-8 md:mb-10 text-center">
                <div className="text-mono text-[11px] uppercase tracking-[0.4em] mb-2 text-muted-foreground">
                  TradeLikeTyo
                </div>
                <div className="font-serif text-4xl md:text-6xl font-normal italic leading-none" style={{ color: 'hsl(36 29% 40%)' }}>
                  Ecosystem
                </div>
                <p className="mt-3 text-sm md:text-[13px] tracking-[0.04em] text-muted-foreground">
                  Две тактики — одна экосистема — единый риск-менеджмент
                </p>
              </div>

              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                {tactics.map((tactic) => (
                  <TacticCard key={tactic.id} tactic={tactic} />
                ))}
              </div>

              <div className="md:hidden space-y-4">
                {flows.map((flow, flowIndex) => (
                  <div key={flow.id} className="flex flex-col items-center">
                    <TacticCard tactic={tactics[flowIndex]} />
                    <div className="flex h-8 items-center justify-center">
                      <ArrowDown />
                    </div>
                    <div className="w-full flex flex-col items-center">
                      {flow.nodes.map((node, index) => (
                        <div key={node.name} className="w-full flex flex-col items-center">
                          <FlowCard node={node} />
                          {index < flow.nodes.length - 1 && (
                            <div className="flex h-8 items-center justify-center">
                              <ArrowDown />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {flows.map((flow) => (
                  <div key={flow.id} className="flex flex-col items-center">
                    {flow.nodes.map((node, index) => (
                      <div key={node.name} className="w-full flex flex-col items-center">
                        <FlowCard node={node} />
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
                <div className="mb-4 flex items-center justify-center gap-3 text-center text-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  <span className="h-px w-10 md:w-28 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
                  Единый путь исполнения
                  <span className="h-px w-10 md:w-28 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
                </div>

                <div className="w-full max-w-2xl space-y-3">
                  {sharedNodes.map((node, index) => (
                    <div key={node.name} className="flex flex-col items-center">
                      <div className="w-full rounded-xl p-4 md:p-5 bg-card border border-foreground/20">
                        <div className="text-mono text-[10px] uppercase tracking-[0.24em] mb-2 text-muted-foreground">
                          {node.step}
                        </div>
                        <h4 className="text-base md:text-lg font-semibold leading-tight text-foreground">
                          {node.name}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
                  <div key={stat.value} className="rounded-xl p-4 text-center bg-card border border-border">
                    <div className="font-serif text-3xl md:text-4xl font-normal italic leading-none text-foreground">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm leading-snug text-foreground">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
