import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const stages = [
  {
    number: '01',
    title: 'Фундамент',
    description: 'Вы перестаёте видеть отдельные свечи и начинаете видеть фазу. Это убирает хаос и возвращает ясность.',
  },
  {
    number: '02',
    title: 'Тренировки',
    description: 'Отрабатываете сценарии и убираете случайные решения.',
  },
  {
    number: '03',
    title: 'Практика',
    description: 'Правила становятся сильнее эмоций.',
  },
  {
    number: '04',
    title: 'Самостоятельность',
    description: 'Вы больше не зависите от подсказок. Вы понимаете, когда входа нет.',
  },
  {
    number: '05',
    title: 'Торговля',
    description: 'Вы работаете на дистанции. Стабильность важнее количества сделок.',
  },
];

const StagesSection = () => {
  return (
    <section id="stages" className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Как формируется системный трейдер?
          </h2>
          
          <div className="mt-12 relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
            
            <div className="space-y-6">
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className="relative flex items-start gap-6 md:pl-6"
                >
                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-0 w-12 h-12 items-center justify-center bg-background z-10">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
                  </div>
                  
                  <div className="flex-1 p-6 bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-all duration-300 md:ml-8">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-mono text-muted-foreground text-sm">{stage.number}</span>
                      <h3 className="text-lg font-medium text-foreground">{stage.title}</h3>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-line">{stage.description}</p>
                  </div>
                </div>
              ))}
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

export default StagesSection;