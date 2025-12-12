import { ArrowRight, Check } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const steps = [
  {
    step: '1',
    timeframe: 'W1',
    title: 'Фаза цикла',
    description: 'Определяем, где рынок: накопление, выход, тест или тренд.',
  },
  {
    step: '2',
    timeframe: 'D1',
    title: 'Подтверждение направления',
    description: 'Совпадает ли локальное движение с глобальной фазой.',
  },
  {
    step: '3',
    timeframe: 'H4',
    title: 'Зона синхронизации (вход)',
    description: 'Вход только там, где совпадают контекст, структура и реакция.',
  },
  {
    step: '4',
    timeframe: 'D1',
    title: 'Потенциал движения',
    description: 'Оцениваем, есть ли ход. Без потенциала — сделки нет.',
  },
];

const AlgorithmSection = () => {
  return (
    <section id="algorithm" className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Основа системной торговли
          </h2>
          
          <div className="mt-12 space-y-6">
            {steps.map((item, index) => (
              <div
                key={index}
                className="group relative flex gap-6 p-6 bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-secondary rounded-lg">
                  <span className="text-mono text-lg text-foreground">{item.timeframe}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-mono text-muted-foreground text-sm">Шаг {item.step}</span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 p-6 bg-accent/30 border border-border rounded-xl">
            <div className="flex items-start gap-4">
              <Check className="w-6 h-6 text-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-lg text-foreground font-medium">Совпали все шаги — сделка.</p>
                <p className="text-muted-foreground mt-1">Не совпали — пропуск.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <a
              href={TELEGRAM_LINKS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group"
            >
              Посмотреть структуру вживую
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlgorithmSection;
