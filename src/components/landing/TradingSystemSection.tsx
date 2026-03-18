const modules = [
  {
    id: 'trend-hunter',
    name: 'Trend Hunter',
    label: 'Модуль сигналов',
    description: 'Отслеживает рынок на нескольких таймфреймах. Сообщает о ключевых моментах.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M2 12h4l3-9 4 18 3-9h6" />
      </svg>
    ),
  },
  {
    id: 'echo-gate',
    name: 'Echo-Gate Prototype',
    label: 'Фильтр опыта',
    description: 'Каждый сигнал сравнивается с архивом прошлых сделок. Фильтрация через данные.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'hunter-bot',
    name: 'Hunter Bot',
    label: 'Исполнение сделок',
    description: 'Автоматическое выставление ордеров, сопровождение позиции и управление сделкой.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'risk-sentinel',
    name: 'Risk Sentinel',
    label: 'Контроль риска',
    description: 'Ограничивает торговлю при превышении лимитов. Защита капитала.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />
      </svg>
    ),
  },
];

const TradingSystemSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          <h2 className="heading-section text-foreground mb-10 md:mb-14">
            Как я работаю сейчас
          </h2>

          {/* System Architecture */}
          <div className="relative bg-card border border-border rounded-2xl p-6 md:p-10 overflow-hidden">
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />

            {/* Radial glow */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                background: 'radial-gradient(circle at center, hsl(210 60% 60%), transparent 70%)',
              }}
            />

            <div className="relative z-10">
              {/* Desktop layout */}
              <div className="hidden md:block">
                {/* Top row modules */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {modules.slice(0, 2).map((mod) => (
                    <ModuleCard key={mod.id} module={mod} />
                  ))}
                </div>

                {/* Connection lines top → center */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-px bg-foreground/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/15 border border-foreground/20" />
                    <div className="w-6 h-px bg-foreground/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/15 border border-foreground/20" />
                    <div className="w-20 h-px bg-foreground/10" />
                  </div>
                </div>

                {/* Center — Operator */}
                <div className="flex justify-center mb-4">
                  <div className="px-6 py-4 border border-foreground/20 rounded-xl bg-background/60 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-foreground/15 bg-foreground/5 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-foreground/60">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 20c0-4 3.5-7 7-7s7 3 7 7" />
                          <circle cx="9.5" cy="8" r="2" strokeWidth="1" />
                          <circle cx="14.5" cy="8" r="2" strokeWidth="1" />
                          <path d="M11.5 8h1" strokeWidth="1" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-foreground block">Оператор системы</span>
                        <span className="text-mono text-[10px] text-muted-foreground/60">Направление · Контроль · Решения</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection lines center → bottom */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-px bg-foreground/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/15 border border-foreground/20" />
                    <div className="w-6 h-px bg-foreground/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/15 border border-foreground/20" />
                    <div className="w-20 h-px bg-foreground/10" />
                  </div>
                </div>

                {/* Bottom row modules */}
                <div className="grid grid-cols-2 gap-4">
                  {modules.slice(2, 4).map((mod) => (
                    <ModuleCard key={mod.id} module={mod} />
                  ))}
                </div>
              </div>

              {/* Mobile layout — vertical */}
              <div className="md:hidden space-y-3">
                {/* Operator */}
                <div className="px-5 py-4 border border-foreground/20 rounded-xl bg-background/60 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-foreground/15 bg-foreground/5 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-foreground/60">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 20c0-4 3.5-7 7-7s7 3 7 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-foreground block">Оператор системы</span>
                      <span className="text-mono text-[10px] text-muted-foreground/60">Направление · Контроль</span>
                    </div>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex justify-center">
                  <div className="w-px h-4 bg-foreground/10" />
                </div>

                {/* Modules */}
                {modules.map((mod, i) => (
                  <div key={mod.id}>
                    <ModuleCard module={mod} />
                    {i < modules.length - 1 && (
                      <div className="flex justify-center mt-3">
                        <div className="w-px h-4 bg-foreground/10" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="mt-8 md:mt-10 max-w-2xl">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Каждое решение проходит через систему
            </p>
            <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed">
              Я не вхожу, если нет допуска
            </p>
            <p className="mt-3 text-base md:text-lg text-foreground font-medium leading-relaxed">
              Даже если рынок "кажется очевидным"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const ModuleCard = ({ module }: { module: typeof modules[number] }) => (
  <div className="p-4 md:p-5 border border-foreground/[0.08] rounded-xl bg-background/30">
    <div className="flex items-center gap-2.5 mb-2">
      <div className="w-8 h-8 rounded-lg border border-foreground/10 bg-foreground/[0.04] flex items-center justify-center text-foreground/50">
        {module.icon}
      </div>
      <div>
        <span className="text-sm font-semibold text-foreground block leading-tight">{module.name}</span>
        <span className="text-mono text-[10px] text-muted-foreground/60">{module.label}</span>
      </div>
    </div>
    <p className="text-xs text-muted-foreground/70 leading-relaxed">{module.description}</p>
  </div>
);

export default TradingSystemSection;
