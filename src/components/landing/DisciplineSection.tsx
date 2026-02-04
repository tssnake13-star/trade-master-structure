import { Check } from 'lucide-react';

const disciplinePoints = [
  'Сценарии',
  'Проверки',
  'Дисциплина',
  'Ответственность',
];

const DisciplineSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Почему без жёстких правил трейдинг не работает
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              В трейдинге не работает подход «делай как чувствуешь».
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Работает только подход «делай по правилам».
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-card border border-border rounded-xl">
            <p className="text-sm text-muted-foreground mb-4">В обучении есть:</p>
            <div className="grid grid-cols-2 gap-3">
              {disciplinePoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-foreground/70" />
                  <span className="text-foreground text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            Это не давление. Это защита от хаоса и слива депозита.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DisciplineSection;
