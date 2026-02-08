import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const filters = [
  {
    step: '01',
    timeframe: 'W1',
    title: 'Фаза рынка',
    label: 'Фильтр контекста',
    description: 'Защита от входа «против толпы» и понимание глобального приоритета.',
  },
  {
    step: '02',
    timeframe: 'D1',
    title: 'Подтверждение',
    label: 'Фильтр сценария',
    description: 'Устранение импульсивных решений через поиск объективных причин для сделки.',
  },
  {
    step: '03',
    timeframe: 'H4',
    title: 'Точка входа',
    label: 'Зона синхронизации',
    description: 'Математическое обоснование входа, исключающее «угадывание».',
  },
  {
    step: '04',
    timeframe: 'D1',
    title: 'Потенциал',
    label: 'Фильтр выхода',
    description: 'Чёткий расчёт дистанции до цели до открытия позиции.',
  },
];

const outerModules = [
  { id: 'context', label: 'Модуль Глобального контекста', sub: 'Фильтрация по W1 / D1' },
  { id: 'noise', label: 'Модуль Рыночного шума', sub: 'Запрет торговли в «вязком» рынке' },
  { id: 'risk', label: 'Risk Sentinel', sub: 'Контроль лимитов и групп инструментов' },
];

const AlgorithmSection = () => {
  return (
    <section id="algorithm" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Архитектура Core Protocol
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Каждый шаг — фильтр безопасности. Сделка открывается только после прохождения всех уровней.
          </p>

          {/* 4 Filters */}
          <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {filters.map((item, index) => (
              <div
                key={index}
                className="p-4 md:p-5 bg-card border border-border rounded-xl flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mono text-xs text-muted-foreground">{item.step}</span>
                  <span className="text-mono text-xs font-medium text-foreground/40">{item.timeframe}</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-foreground">{item.title}</h3>
                <span className="text-mono text-[10px] text-muted-foreground/70 mt-0.5 mb-2">{item.label}</span>
                <p className="text-xs text-muted-foreground leading-relaxed mt-auto">{item.description}</p>
              </div>
            ))}
          </div>

          {/* === Engineering System Map === */}
          <div className="mt-12 md:mt-16">
            <h3 className="text-sm font-medium text-muted-foreground mb-6 md:mb-8 tracking-wide uppercase">
              Визуальная карта системы
            </h3>

            <div className="relative bg-card border border-border rounded-2xl p-6 md:p-10 overflow-hidden">
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px',
                }}
              />

              <div className="relative z-10">
                {/* Outer Shell — Trade OS */}
                <div className="border border-foreground/10 rounded-xl p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <span className="text-mono text-[10px] text-muted-foreground/50 tracking-widest uppercase">Outer Shell</span>
                    <span className="text-mono text-xs md:text-sm font-semibold text-foreground">Trade OS</span>
                    <span className="text-mono text-[10px] text-muted-foreground/40">· Защитные модули</span>
                  </div>

                  {/* Modules row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 md:mb-6">
                    {outerModules.map((mod) => (
                      <div
                        key={mod.id}
                        className="px-4 py-3 border border-foreground/[0.06] rounded-lg bg-background/30"
                      >
                        <span className="text-xs font-medium text-foreground/80 block">{mod.label}</span>
                        <span className="text-mono text-[10px] text-muted-foreground/50 block mt-1">{mod.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connection lines — visual */}
                  <div className="hidden md:flex justify-center mb-4">
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-px bg-foreground/10" />
                      <div className="w-1.5 h-1.5 rounded-full border border-foreground/20" />
                      <div className="w-16 h-px bg-foreground/10" />
                      <div className="w-1.5 h-1.5 rounded-full border border-foreground/20" />
                      <div className="w-16 h-px bg-foreground/10" />
                      <div className="w-1.5 h-1.5 rounded-full border border-foreground/20" />
                      <div className="w-8 h-px bg-foreground/10" />
                    </div>
                  </div>

                  {/* Inner Core — Trade System */}
                  <div className="border border-foreground/20 rounded-lg p-4 md:p-5 bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-mono text-[10px] text-muted-foreground/50 tracking-widest uppercase">Core</span>
                      <span className="text-sm md:text-base font-bold text-foreground">Trade System</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mb-3">
                      Алгоритм «Зона синхронизации»
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-mono text-[10px] md:text-xs text-foreground/60 border border-foreground/10 rounded-full">
                        Фаза
                      </span>
                      <span className="px-3 py-1 text-mono text-[10px] md:text-xs text-foreground/60 border border-foreground/10 rounded-full">
                        Подтверждение
                      </span>
                      <span className="px-3 py-1 text-mono text-[10px] md:text-xs text-foreground/60 border border-foreground/10 rounded-full">
                        ТВХ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <p className="mt-6 text-xs text-muted-foreground/50 text-center leading-relaxed max-w-md mx-auto">
                  В центре — неизменное Ядро (Trade System). Вокруг — защитные модули фона (Trade OS). Переход от алгоритма к полноценной системе безопасности капитала.
                </p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              Получить алгоритм принятия решений
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              Написать Сергею Тё
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlgorithmSection;
