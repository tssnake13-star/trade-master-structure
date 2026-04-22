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
  { value: '8:1+', label: 'R:R резонансных сделок', sublabel: 'с июня 2020' },
];

const schemePalette = {
  bg: 'hsl(225 36% 4%)',
  surface: 'hsl(226 42% 9%)',
  border: 'hsl(220 37% 19%)',
  accentBlue: 'hsl(216 100% 58%)',
  accentCyan: 'hsl(186 100% 50%)',
  accentGold: 'hsl(50 100% 50%)',
  accentGreen: 'hsl(151 100% 45%)',
  text: 'hsl(233 40% 94%)',
  muted: 'hsl(214 25% 44%)',
};

const ArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-muted-foreground/40">
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

const TacticCard = ({
  tactic,
  accentColor,
}: {
  tactic: (typeof tactics)[number];
  accentColor: string;
}) => (
  <div
    className="rounded-[10px] px-4 py-4 md:px-5 md:py-5 relative overflow-hidden"
    style={{
      backgroundColor: schemePalette.surface,
      border: `1px solid ${schemePalette.border}`,
    }}
  >
    <div
      className="absolute left-0 right-0 top-0 h-px"
      style={{
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
      }}
    />
    <div
      className="text-mono text-[10px] uppercase tracking-[0.3em] mb-2"
      style={{ color: accentColor }}
    >
      {tactic.step}
    </div>
    <h3 className="text-lg md:text-xl font-semibold leading-tight" style={{ color: schemePalette.text }}>
      {tactic.name}
    </h3>
    <p className="mt-2 text-sm leading-relaxed max-w-md" style={{ color: schemePalette.muted }}>
      {tactic.description}
    </p>
  </div>
);

const FlowCard = ({
  node,
  accentColor,
}: {
  node: (typeof flows)[number]['nodes'][number];
  accentColor: string;
}) => (
  <div
    className="w-full rounded-[10px] p-4 md:p-5"
    style={{
      backgroundColor: schemePalette.surface,
      border: `1px solid ${schemePalette.border}`,
    }}
  >
    <div
      className="text-mono text-[10px] uppercase tracking-[0.24em] mb-2"
      style={{ color: accentColor }}
    >
      {node.step}
    </div>
    <h4 className="text-base md:text-lg font-semibold leading-tight" style={{ color: schemePalette.text }}>
      {node.name}
    </h4>
    <p className="mt-2 text-sm leading-relaxed" style={{ color: schemePalette.muted }}>
      {node.description}
    </p>
    {node.badge && (
      <span
        className="mt-3 inline-flex rounded-full px-3 py-1 text-[11px]"
        style={{
          color: schemePalette.accentGold,
          border: `1px solid ${schemePalette.accentGold}40`,
          backgroundColor: `${schemePalette.accentGold}14`,
        }}
      >
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
          <h2 className="heading-section text-foreground mb-4">
            Как работает система изнутри
          </h2>
          <div
            className="mt-10 md:mt-14 rounded-2xl p-5 md:p-8 relative overflow-hidden"
            style={{
              backgroundColor: schemePalette.bg,
              border: `1px solid ${schemePalette.border}`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(${schemePalette.accentBlue}12 1px, transparent 1px), linear-gradient(90deg, ${schemePalette.accentBlue}12 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10">
              <div className="mb-8 md:mb-10 text-center">
                <div className="text-mono text-[11px] uppercase tracking-[0.4em] mb-2" style={{ color: schemePalette.accentBlue }}>
                  TradeLikeTyo
                </div>
                <div className="text-3xl md:text-5xl font-semibold leading-none" style={{ color: schemePalette.text }}>
                  <span style={{ color: schemePalette.accentCyan }}>Ecosystem</span>
                </div>
                <p className="mt-3 text-sm md:text-[13px] tracking-[0.04em]" style={{ color: schemePalette.muted }}>
                  Две тактики — одна экосистема — единый риск-менеджмент
                </p>
              </div>

              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                {tactics.map((tactic, index) => (
                  <TacticCard
                    key={tactic.id}
                    tactic={tactic}
                    accentColor={index === 0 ? schemePalette.accentBlue : schemePalette.accentGold}
                  />
                ))}
              </div>

              <div className="md:hidden space-y-4">
                {flows.map((flow, flowIndex) => (
                  <div key={flow.id} className="flex flex-col items-center">
                    <TacticCard
                      tactic={tactics[flowIndex]}
                      accentColor={flowIndex === 0 ? schemePalette.accentBlue : schemePalette.accentGold}
                    />
                    <div className="flex h-8 items-center justify-center">
                      <ArrowDown />
                    </div>
                    <div className="w-full flex flex-col items-center">
                      {flow.nodes.map((node, index) => (
                        <div key={node.name} className="w-full flex flex-col items-center">
                          <FlowCard
                            node={node}
                            accentColor={flowIndex === 0 ? schemePalette.accentBlue : schemePalette.accentGold}
                          />
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
                {flows.map((flow, flowIndex) => (
                  <div key={flow.id} className="flex flex-col items-center">
                    {flow.nodes.map((node, index) => (
                      <div key={node.name} className="w-full flex flex-col items-center">
                        <FlowCard
                          node={node}
                          accentColor={flowIndex === 0 ? schemePalette.accentBlue : schemePalette.accentGold}
                        />
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
                <div className="mb-4 flex items-center justify-center gap-3 text-center text-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: schemePalette.accentGreen }}>
                  <span className="h-px w-10 md:w-28" style={{ background: `linear-gradient(90deg, transparent, ${schemePalette.accentGreen}59, transparent)` }} />
                  Единый путь исполнения
                  <span className="h-px w-10 md:w-28" style={{ background: `linear-gradient(90deg, transparent, ${schemePalette.accentGreen}59, transparent)` }} />
                </div>

                <div className="w-full max-w-2xl space-y-3">
                  {sharedNodes.map((node, index) => (
                    <div key={node.name} className="flex flex-col items-center">
                      <div
                        className="w-full rounded-[10px] p-4 md:p-5"
                        style={{
                          backgroundColor: schemePalette.surface,
                          border: `1px solid ${index === 0 ? schemePalette.accentGreen : `${schemePalette.accentGreen}59`}`,
                          boxShadow: index === 0 ? `0 0 24px ${schemePalette.accentGreen}1f` : 'none',
                        }}
                      >
                        <div className="text-mono text-[10px] uppercase tracking-[0.24em] mb-2" style={{ color: schemePalette.accentGreen }}>
                          {node.step}
                        </div>
                        <h4 className="text-base md:text-lg font-semibold leading-tight" style={{ color: schemePalette.text }}>
                          {node.name}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: schemePalette.muted }}>
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
                {stats.map((stat, index) => (
                  <div
                    key={stat.value}
                    className="rounded-[10px] p-4 text-center"
                    style={{
                      backgroundColor: schemePalette.surface,
                      border: `1px solid ${schemePalette.border}`,
                    }}
                  >
                    <div
                      className="text-2xl md:text-3xl font-semibold leading-none"
                      style={{ color: index === 2 ? schemePalette.accentGreen : schemePalette.accentCyan }}
                    >
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm leading-snug" style={{ color: schemePalette.text }}>
                      {stat.label}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed" style={{ color: schemePalette.muted }}>
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
