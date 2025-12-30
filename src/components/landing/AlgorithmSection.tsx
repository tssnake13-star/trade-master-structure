import { ArrowRight, Check } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const steps = [
  {
    step: '1',
    timeframe: 'W1',
    title: 'Фаза рыночного цикла',
    description: 'Сначала возвращаем ясность. Определяем фазу рынка. Без этого любое решение будет эмоциональным.',
  },
  {
    step: '2',
    timeframe: 'D1',
    title: 'Подтверждение направления',
    description: 'Проверяем совпадение локального движения с общей картиной. Если не совпадает, решение не принимается.',
  },
  {
    step: '3',
    timeframe: 'H4',
    title: 'Зона синхронизации (вход)',
    description: 'Вход только при совпадении условий и реакции. Цель не быть в рынке, а действовать по сценарию.',
  },
  {
    step: '4',
    timeframe: 'D1',
    title: 'Потенциал движения',
    description: 'Оцениваем запас хода заранее. Нет пространства, значит нет сделки.',
  },
];

const AlgorithmSection = () => {
  return (
    <section id="algorithm" className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Как выглядит системное торговое решение?
          </h2>
          
          <p className="mt-6 text-lg text-muted-foreground">
            Системное решение это когда вы не торопитесь. Вы либо видите совпадение условий, либо спокойно проходите мимо.
          </p>
          
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
                  <p className="text-muted-foreground whitespace-pre-line">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 p-6 bg-accent/30 border border-border rounded-xl">
            <div className="flex items-start gap-4">
              <Check className="w-6 h-6 text-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-lg text-foreground font-medium">Совпали условия — появляется сделка.</p>
                <p className="text-muted-foreground mt-1">Не совпало хотя бы одно — осознанный пропуск.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <p className="mb-3 text-sm text-muted-foreground/70">
              Здесь я разбираю рынок и сделки без сигналов и угадываний.
            </p>
            <a
              href={TELEGRAM_LINKS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group"
            >
              Перейти в Telegram-канал
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              Разборы сделок, логика входов и путь к торговому алгоритму 🧠
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlgorithmSection;