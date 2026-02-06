import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const steps = [
  {
    step: '1',
    timeframe: 'W1',
    title: 'Фаза рынка',
    description: 'Без этого любое решение становится эмоциональным.',
  },
  {
    step: '2',
    timeframe: 'D1',
    title: 'Подтверждение',
    description: 'Нет совпадения условий — нет входа.',
  },
  {
    step: '3',
    timeframe: 'H4',
    title: 'Зона входа',
    description: 'Вы действуете по сценарию, а не из реакции.',
  },
  {
    step: '4',
    timeframe: 'D1',
    title: 'Потенциал',
    description: 'Нет пространства — нет сделки.',
  },
];

const AlgorithmSection = () => {
  return (
    <section id="algorithm" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            4 шага системного решения
          </h2>
          
          <div className="mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {steps.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mono text-xs text-muted-foreground">Шаг {item.step}</span>
                  <span className="text-mono text-sm text-foreground font-medium">{item.timeframe}</span>
                </div>
                <h3 className="text-sm md:text-base font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
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
