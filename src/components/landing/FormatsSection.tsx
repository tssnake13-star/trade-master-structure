import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const formats = [
  {
    name: 'Trade System',
    subtitle: '90 дней',
    description: 'Базовая инсталляция протокола. Установка фундамента архитектуры рынка и запуск ядра алгоритма принятия решений для устранения хаоса в торговле.',
    includes: null,
    detailTitle: 'Ядро системы (Core Protocol)',
    detailDescription: 'Установка алгоритма «Зона синхронизации». Это фундамент, который убирает хаос и даёт чёткий ответ: «Входим или ждём?».',
    detailResult: 'Вы перестаёте угадывать рынок и начинаете работать по строгому математическому протоколу.',
  },
  {
    name: 'TradeOS 365',
    subtitle: 'Год внедрения системы',
    description: 'Основной формат работы. Подходит тем, кто уже торговал и устал от хаоса.',
    includes: [
      'Полная методология TradeOS',
      'Зона синхронизации',
      'Алгоритм входа и сопровождения',
      'Риск-менеджмент',
      'Закрытая рабочая группа',
      'Регулярные разборы',
    ],
    detailTitle: null,
    detailDescription: null,
    detailResult: 'Системное мышление. Чёткая структура принятия решений. Дисциплина вместо угадывания.',
  },
  {
    name: 'TradeOS Plus',
    subtitle: 'Полная конфигурация системы',
    description: 'Для тех, кто хочет максимальную интеграцию. Включает всё из TradeOS 365 плюс:',
    includes: [
      'Полный комплект индикаторов',
      'HunterBot',
      'Risk Sentinel',
      'Расширенные модули фильтрации',
      'Приоритетная обратная связь',
      'Индивидуальная настройка инструментов',
    ],
    detailTitle: null,
    detailDescription: null,
    detailResult: 'Быстрое внедрение системы. Повышенная точность входов. Жёсткий контроль риска.',
  },
];

const FormatsSection = () => {
  return (
    <section id="formats" className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Три уровня сотрудничества
          </h2>
          
          <div className="mt-8 md:mt-10 grid md:grid-cols-3 gap-3 md:gap-4">
            {formats.map((format, index) => (
              <div
                key={index}
                className="p-4 md:p-5 bg-card border border-border rounded-xl flex flex-col"
              >
                <h3 className="text-lg font-semibold text-foreground">{format.name}</h3>
                <p className="text-mono text-xs text-muted-foreground mt-1">{format.subtitle}</p>
                <p className="text-sm text-muted-foreground mt-3">{format.description}</p>
                
                {format.includes && (
                  <ul className="mt-3 space-y-1.5">
                    {format.includes.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-foreground/50 mt-0.5">—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {(format.detailTitle || format.detailDescription) && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    {format.detailTitle && (
                      <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">{format.detailTitle}</p>
                    )}
                    {format.detailDescription && (
                      <p className="text-sm text-muted-foreground mt-2">{format.detailDescription}</p>
                    )}
                  </div>
                )}

                {format.detailResult && (
                  <p className="text-sm text-foreground/90 mt-4 pt-4 border-t border-border/60 font-medium">
                    → {format.detailResult}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex flex-col gap-3">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              Встроить алгоритм
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm text-muted-foreground font-medium rounded-lg border border-border/50 hover:text-foreground hover:border-border transition-all duration-200"
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
