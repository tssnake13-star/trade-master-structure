import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const formats = [
  {
    name: 'ProStart',
    subtitle: 'фундамент системы',
    description: 'Наводите порядок в голове. Изучаете структуру рынка, фазы и базовый алгоритм.',
    goal: 'Цель – видеть рынок системно.',
    duration: '90 дней',
  },
  {
    name: 'TradeMaster',
    subtitle: 'годовая программа',
    description: 'Полная трансформация подхода. Сценарии, сопровождение сделок, работа по системе.',
    goal: 'От случайных входов к профессиональной торговле.',
    duration: '365 дней',
  },
  {
    name: 'VIP',
    subtitle: 'всё включено',
    description: 'Максимальная глубина. Личная работа. Пожизненные материалы и поддержка.',
    goal: 'Профессиональный уровень.',
    duration: '365 дней',
  },
];

const FormatsSection = () => {
  return (
    <section id="formats" className="py-16 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-5xl">
          <h2 className="heading-section text-foreground">
            Три уровня сотрудничества
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Выберите формат под вашу готовность.
          </p>
          
          <div className="mt-10 grid md:grid-cols-3 gap-4 md:gap-6">
            {formats.map((format, index) => (
              <div
                key={index}
                className="flex flex-col p-5 md:p-6 bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-all duration-300"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-foreground">{format.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{format.subtitle}</p>
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {format.description}
                </p>
                
                <p className="text-foreground/80 text-sm mt-3">
                  {format.goal}
                </p>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-mono text-sm text-muted-foreground">{format.duration}</p>
                </div>
                
                <a
                  href={TELEGRAM_LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
                >
                  Выбрать этот путь
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormatsSection;
