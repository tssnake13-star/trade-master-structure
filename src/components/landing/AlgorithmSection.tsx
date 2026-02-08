import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const AlgorithmSection = () => {
  return (
    <section id="algorithm" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Архитектура решения
          </h2>

          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Core */}
            <div className="p-5 md:p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-mono text-xs text-muted-foreground">Core</span>
                <span className="text-mono text-sm text-foreground font-medium">Ядро</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                Алгоритм «Зона синхронизации»
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Три критических фильтра — <span className="text-foreground font-medium">Фаза</span>, <span className="text-foreground font-medium">Подтверждение</span>, <span className="text-foreground font-medium">ТВХ</span> — которые превращают рыночный хаос в математическую вероятность. Без прохождения Ядра торговля запрещена.
              </p>
            </div>

            {/* Modules */}
            <div className="p-5 md:p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-mono text-xs text-muted-foreground">Modules</span>
                <span className="text-mono text-sm text-foreground font-medium">Модули</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                Контур фильтрации фона
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Подключаемые модули контекста и фильтрации фона. Работают как «броня» системы, отсекая сделки в неопределённых зонах и защищая капитал в «вязком» рынке.
              </p>
            </div>
          </div>

          {/* Visual System Map */}
          <div className="mt-8 md:mt-10">
            <div className="relative flex items-center justify-center py-10 md:py-14">
              {/* Outer ring — Modules */}
              <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-border/60" />
              <div className="absolute w-64 h-64 md:w-80 md:h-80 flex items-start justify-center pt-3 md:pt-4">
                <span className="text-mono text-[10px] md:text-xs text-muted-foreground/70 tracking-widest uppercase">Trade OS · Модули Фона</span>
              </div>

              {/* Inner ring — Core */}
              <div className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border border-foreground/20 bg-card/50" />

              {/* Center label */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <span className="text-mono text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase">Core</span>
                <span className="text-sm md:text-base font-semibold text-foreground">Trade System</span>
                <span className="text-mono text-[10px] text-muted-foreground/60">Ядро</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 text-center max-w-lg mx-auto leading-relaxed">
              Визуальная карта системы: в центре — неизменное Ядро (Trade System), вокруг — защитные Модули Фона (Trade OS). Переход от простого алгоритма к полноценной системе безопасности капитала.
            </p>
          </div>

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
