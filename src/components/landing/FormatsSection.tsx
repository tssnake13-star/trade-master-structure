import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const formats = [
  {
    name: 'ProStart',
    subtitle: 'фундамент системы',
    description: 'Для трейдеров, которые хотят навести порядок в мышлении и перестать угадывать.\nВы изучаете структуру рынка, фазы, сценарии и базовый алгоритм принятия решений.',
    goal: 'Цель — научиться видеть рынок системно.',
    duration: '90 дней работы',
  },
  {
    name: 'TradeMaster',
    subtitle: 'годовая программа',
    description: 'Для трейдеров, уставших от хаоса и эмоциональных решений.\nПолная трансформация торгового подхода: сценарии, сопровождение сделок и работа по системе.',
    goal: 'Переход от случайных входов к профессиональной торговле.',
    duration: '365 дней работы',
  },
  {
    name: 'VIP',
    subtitle: 'всё включено',
    description: 'Для тех, кто хочет максимальную глубину и личную работу.\nГодовая программа, пожизненные материалы, личная поддержка, инструменты и доступ к аналитике.',
    goal: 'Формат для работы на профессиональном уровне.',
    duration: '365 дней работы',
  },
];

const FormatsSection = () => {
  return (
    <section id="formats" className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-5xl">
          <h2 className="heading-section text-foreground">
            Три уровня глубины работы в TRADE MASTER
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Выберите формат, соответствующий вашей готовности брать ответственность за результат.
          </p>
          
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {formats.map((format, index) => (
              <div
                key={index}
                className="flex flex-col p-6 md:p-8 bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-all duration-300"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground">{format.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{format.subtitle}</p>
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 whitespace-pre-line">
                  {format.description}
                </p>
                
                <p className="text-foreground/80 text-sm mt-4 leading-relaxed">
                  {format.goal}
                </p>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-mono text-sm text-muted-foreground">{format.duration}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              Узнать стоимость и формат участия
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormatsSection;
