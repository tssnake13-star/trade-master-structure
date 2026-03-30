import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const modules = [
  {
    id: 'trend-hunter',
    name: 'TrendHunter',
    shortDesc: 'Сигналы',
    tooltip: 'Отслеживает рынок на нескольких таймфреймах. Сообщает о ключевых моментах.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M2 12h4l3-9 4 18 3-9h6" />
      </svg>
    ),
  },
  {
    id: 'echo-gate',
    name: 'Echo-Gate',
    shortDesc: 'Фильтрация',
    tooltip: 'Каждый сигнал сравнивается с архивом прошлых сделок. Фильтрация через данные.',
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
    id: 'risk-sentinel',
    name: 'Risk Sentinel',
    shortDesc: 'Контроль риска',
    tooltip: 'Ограничивает торговлю при превышении лимитов. Защита капитала.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />
      </svg>
    ),
  },
  {
    id: 'hunter-bot',
    name: 'HunterBot',
    shortDesc: 'Исполнение',
    tooltip: 'Автоматическое выставление ордеров, сопровождение позиции и управление сделкой.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-foreground/20 shrink-0">
    <path d="M5 12h14M13 6l6 6-6 6" />
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
          <p className="text-base md:text-lg text-muted-foreground mb-10 md:mb-14">
            Каждое решение проходит через систему
          </p>

          {/* Desktop — horizontal flow */}
          <TooltipProvider delayDuration={200}>
            <div className="hidden md:flex items-start justify-between gap-2 bg-card border border-border rounded-2xl p-8 overflow-hidden relative">
              {/* Grid background */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="absolute inset-0 opacity-[0.04]" style={{ background: 'radial-gradient(circle at center, hsl(210 60% 60%), transparent 70%)' }} />

              <div className="relative z-10 flex items-center justify-between w-full gap-3">
                {modules.map((mod, i) => (
                  <div key={mod.id} className="contents">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-3 p-5 border border-foreground/[0.08] rounded-xl bg-background/30 hover:border-foreground/20 transition-colors cursor-default flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg border border-foreground/10 bg-foreground/[0.04] flex items-center justify-center text-foreground/50">
                            {mod.icon}
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-semibold text-foreground block">{mod.name}</span>
                            <span className="text-mono text-[10px] text-muted-foreground/60">{mod.shortDesc}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[220px]">
                        <p className="text-xs">{mod.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                    {i < modules.length - 1 && (
                      <div className="flex items-center pt-6">
                        <ArrowIcon />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile — vertical */}
            <div className="md:hidden bg-card border border-border rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="relative z-10 space-y-3">
                {modules.map((mod, i) => (
                  <div key={mod.id}>
                    <div className="p-4 border border-foreground/[0.08] rounded-xl bg-background/30">
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg border border-foreground/10 bg-foreground/[0.04] flex items-center justify-center text-foreground/50">
                          {mod.icon}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground block leading-tight">{mod.name}</span>
                          <span className="text-mono text-[10px] text-muted-foreground/60">{mod.shortDesc}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed mt-2">{mod.tooltip}</p>
                    </div>
                    {i < modules.length - 1 && (
                      <div className="flex justify-center py-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-foreground/15">
                          <path d="M12 5v14M6 13l6 6 6-6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TooltipProvider>

          <div className="mt-8 md:mt-10 max-w-2xl">
            <p className="text-base md:text-lg text-foreground font-medium leading-relaxed">
              Я не вхожу, если нет допуска
            </p>
            <p className="mt-2 text-base md:text-lg text-muted-foreground leading-relaxed">
              Даже если рынок "кажется очевидным"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradingSystemSection;
