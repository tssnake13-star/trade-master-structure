import { Check, X } from 'lucide-react';

const fitItems = [
  'Торговали и теряли деньги',
  'Готовы работать по правилам',
  'Готовы пропускать сделки',
];

const notFitItems = [
  'Хотите сигналы',
  'Не готовы соблюдать правила',
  'Ищете мягкий формат',
  'Хотите быть в рынке постоянно',
  'Не готовы к дисциплине',
];

const FitSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Кому подходит — а кому нет
          </h2>
          
          <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Fit column */}
            <div className="p-4 md:p-5 bg-accent/20 border border-border rounded-xl">
              <h3 className="text-base font-medium text-foreground mb-4">
                Подходит:
              </h3>
              <ul className="space-y-3">
                {fitItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Not fit column */}
            <div className="p-4 md:p-5 bg-secondary/30 border border-border rounded-xl">
              <h3 className="text-base font-medium text-foreground mb-4">
                Не подходит:
              </h3>
              <ul className="space-y-3">
                {notFitItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <X className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <p className="mt-6 md:mt-8 text-sm md:text-base text-foreground font-medium text-center">
            Здесь не получится торговать как хочется.<br />
            Здесь работают по системе.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FitSection;
