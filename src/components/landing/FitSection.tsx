import { Check, X } from 'lucide-react';

const fitItems = [
  'Торговали и теряли деньги',
  'Готовы работать по правилам',
  'Готовы фильтровать сделки',
  'Готовы пропускать, когда условий нет',
];

const notFitItems = [
  'Ищете лёгкие деньги',
  'Ждёте сигналы',
  'Не готовы к ответственности',
  'Хотите быть в рынке постоянно',
];

const FitSection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Кому подходит TRADE MASTER — а кому нет?
          </h2>
          
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            {/* Fit column */}
            <div className="p-6 bg-accent/20 border border-border rounded-xl">
              <h3 className="text-lg font-medium text-foreground mb-6">
                Подходит, если вы:
              </h3>
              <ul className="space-y-4">
                {fitItems.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <Check className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Not fit column */}
            <div className="p-6 bg-secondary/30 border border-border rounded-xl">
              <h3 className="text-lg font-medium text-foreground mb-6">
                Не подходит, если вы:
              </h3>
              <ul className="space-y-4">
                {notFitItems.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <p className="mt-10 text-lg text-muted-foreground text-center">
            Этот подход не для всех — и в этом его сила.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FitSection;