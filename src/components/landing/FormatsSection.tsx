import { ArrowRight, MessageCircle, Star } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const FormatsSection = () => {
  return (
    <section id="formats" className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-5xl mx-auto">
          <h2 className="heading-section text-foreground">
            Три уровня сотрудничества
          </h2>

          {/* Desktop: 3 columns with center dominant */}
          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-[1fr_1.15fr_1fr] gap-3 md:gap-4 items-start">

            {/* Mobile order: TradeOS 365 first, then Plus, then Trade System */}
            {/* Trade System — step, not alternative */}
            <div className="order-3 md:order-1 p-4 md:p-5 bg-card border border-border/60 rounded-xl flex flex-col opacity-90">
              <h3 className="text-base font-semibold text-foreground/80">Trade System</h3>
              <p className="text-mono text-xs text-muted-foreground mt-1">90 дней</p>
              <p className="text-sm text-muted-foreground mt-3">
                Базовая инсталляция протокола. Установка фундамента и запуск ядра алгоритма принятия решений.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-3 italic">
                Базовая установка без расширенных модулей и полной конфигурации системы.
              </p>
              <p className="text-sm text-foreground/70 mt-4 pt-4 border-t border-border/40 font-medium">
                → Вы перестаёте угадывать рынок и начинаете работать по строгому протоколу.
              </p>
            </div>

            {/* TradeOS 365 — dominant center */}
            <div className="order-1 md:order-2 p-5 md:p-6 bg-card border-2 border-foreground/20 rounded-xl flex flex-col relative shadow-[0_0_30px_-10px_hsl(var(--foreground)/0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-mono text-[10px] uppercase tracking-widest text-foreground/60 bg-foreground/5 px-2.5 py-1 rounded-md border border-foreground/10">
                  Основной формат
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground">TradeOS 365</h3>
              <p className="text-mono text-xs text-muted-foreground mt-1">Год внедрения системы</p>
              <p className="text-sm text-muted-foreground mt-3">
                Основной формат работы. Подходит тем, кто уже торговал и устал от хаоса.
              </p>

              <ul className="mt-4 space-y-1.5">
                {[
                  'Полная методология TradeOS',
                  'Зона синхронизации',
                  'Алгоритм входа и сопровождения',
                  'Риск-менеджмент',
                  'Закрытая рабочая группа',
                  'Регулярные разборы',
                ].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-foreground/50 mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm text-foreground/90 mt-4 pt-4 border-t border-foreground/10 font-medium">
                → Системное мышление. Чёткая структура принятия решений. Дисциплина вместо угадывания.
              </p>

              <a
                href={TELEGRAM_LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary group mt-5 text-center"
              >
                Встроить алгоритм
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* TradeOS Plus — extended */}
            <div className="order-2 md:order-3 p-4 md:p-5 bg-card border border-border rounded-xl flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Максимальный уровень интеграции
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">TradeOS Plus</h3>
              <p className="text-mono text-xs text-muted-foreground mt-1">Полная конфигурация + инструменты</p>
              <p className="text-sm text-muted-foreground mt-3">
                Всё из TradeOS 365 плюс:
              </p>

              <ul className="mt-3 space-y-1.5">
                {[
                  'Полный комплект индикаторов',
                  'HunterBot',
                  'Risk Sentinel',
                  'Расширенные модули фильтрации',
                  'Приоритетная обратная связь',
                  'Индивидуальная настройка инструментов',
                ].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-foreground/50 mt-0.5">—</span>
                    <span className={item === 'HunterBot' || item === 'Risk Sentinel' ? 'text-foreground/80 font-medium' : ''}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-sm text-foreground/90 mt-4 pt-4 border-t border-border/60 font-medium">
                → Быстрое внедрение. Повышенная точность. Жёсткий контроль риска.
              </p>
            </div>
          </div>

          {/* Bottom CTA area */}
          <div className="mt-8 flex flex-col items-start gap-3">
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm text-muted-foreground/70 font-medium rounded-lg border border-border/40 hover:text-muted-foreground hover:border-border/60 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              Написать Сергею
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormatsSection;
