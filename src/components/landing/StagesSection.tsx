import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const stages = [
  {
    number: '01',
    title: 'Фундамент',
    description: 'фазы, структура, контекст',
  },
  {
    number: '02',
    title: 'Тренировки',
    description: 'сценарии и фиксация ошибок',
  },
  {
    number: '03',
    title: 'Практика',
    description: 'дисциплина вместо хаоса',
  },
  {
    number: '04',
    title: 'Самостоятельность',
    description: 'фильтрация и алгоритм',
  },
  {
    number: '05',
    title: 'Торговля',
    description: 'удержание и стабильность',
  },
];

const StagesSection = () => {
  return (
    <section id="stages" className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Карта 5 этапов обучения
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
                    <p className="text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-10">
            <a
              href={TELEGRAM_LINKS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group"
            >
              Посмотреть реальные разборы
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;
