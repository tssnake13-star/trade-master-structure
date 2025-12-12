import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const formats = [
  {
    name: 'ProStart',
    subtitle: 'фундамент системы',
    description: 'Для тех, кто хочет полностью перестроить мышление и избавиться от угадываний. Вы получаете основу структуры: фазы, сценарии, зоны, алгоритм действий.',
    goal: 'Цель — навести порядок в голове и увидеть рынок системно.',
    duration: '90 дней работы',
  },
  {
    name: 'TradeMaster',
    subtitle: 'годовая программа',
    description: 'Для трейдеров, которые устали от хаоса и эмоций. Полная трансформация: настройки вашей торговли, сценарии, сопровождение сделок, работа по системе, сообщество.',
    goal: 'Вы переходите от случайных входов к методичной профессиональной торговле.',
    duration: '365 дней',
  },
  {
    name: 'VIP',
    subtitle: 'всё включено',
    description: 'Для тех, кто хочет максимальный доступ на 365 дней. Годовая программа + пожизненные материалы, разборы, личная работа, инструменты, доступ к аналитике и HunterBot.',
    goal: 'Полный набор для тех, кто хочет работать как профессионал на другом уровне.',
    duration: '365 дней',
  },
];

const FormatsSection = () => {
  return (
    <section id="formats" className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-5xl">
          <h2 className="heading-section text-foreground">
            Три формата обучения TRADE MASTER
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Выберите глубину, с которой вы готовы войти в систему.
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
                
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
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
              Узнать стоимость и детали
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormatsSection;
