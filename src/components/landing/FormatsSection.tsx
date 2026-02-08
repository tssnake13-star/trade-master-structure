import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const formats = [
  {
    name: 'Trade System',
    subtitle: '90 дней',
    description: 'Базовая инсталляция протокола. Установка фундамента архитектуры рынка и запуск ядра алгоритма принятия решений для устранения хаоса в торговле.',
    detailTitle: 'Ядро системы (Core Protocol)',
    detailDescription: 'Установка алгоритма «Зона синхронизации». Это фундамент, который убирает хаос и даёт чёткий ответ: «Входим или ждём?».',
    detailResult: 'Вы перестаёте угадывать рынок и начинаете работать по строгому математическому протоколу.',
  },
  {
    name: 'Trade OS',
    subtitle: '365 дней',
    description: 'Полная конфигурация операционной системы. Внедрение всех профессиональных модулей, расширенных фильтров и драйверов системы для работы по жестким алгоритмам мастера.',
    detailTitle: 'Расширенная конфигурация (Core + Background Modules)',
    detailDescription: 'К вашему «Ядру» подключаются модули анализа глобального контекста и фильтрации рыночного шума. Модули автоматически отсекают сделки с низким потенциалом и защищают вас от входов в «вязком» или неопределённом рынке.',
    detailResult: 'Ювелирная точность входов и спокойствие за счёт понимания общего рыночного фона.',
  },
  {
    name: 'V.I.P.',
    subtitle: '365 дней',
    description: 'Индивидуальная архитектура ядра. Прямой доступ к интеллекту автора для персональной настройки системы под ваш капитал и личный контроль каждой сделки.',
    detailTitle: 'Персональная архитектура',
    detailDescription: 'Глубокая кастомизация всей архитектуры под ваш стиль торговли и объём капитала при прямом участии автора.',
    detailResult: null,
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
                
                <div className="mt-4 pt-4 border-t border-border/60">
                  <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">{format.detailTitle}</p>
                  <p className="text-sm text-muted-foreground mt-2">{format.detailDescription}</p>
                  {format.detailResult && (
                    <p className="text-sm text-foreground/90 mt-3 font-medium">
                      → {format.detailResult}
                    </p>
                  )}
                </div>
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

export default FormatsSection;
