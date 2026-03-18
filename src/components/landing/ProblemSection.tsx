import { X } from 'lucide-react';

const fatalErrors = [
  {
    number: '01',
    title: 'Вход без подтверждения',
    description: 'Вы входите без подтверждения структуры.',
  },
  {
    number: '02',
    title: 'Сомнения после входа',
    description: 'Вы сомневаетесь после входа и закрываете раньше.',
  },
  {
    number: '03',
    title: 'Попытка отыграться',
    description: 'Вы пытаетесь отыграться, когда нет допуска.',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            3 ошибки, которые сливают результат
          </h2>
          
          <div className="mt-8 md:mt-10 grid md:grid-cols-3 gap-4">
            {fatalErrors.map((error, index) => (
              <div
                key={index}
                className="p-4 md:p-5 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-4 h-4 text-destructive/70 flex-shrink-0" />
                  <span className="text-mono text-sm text-muted-foreground">{error.number}</span>
                </div>
                <h3 className="text-base md:text-lg font-medium text-foreground mb-2">{error.title}</h3>
                <p className="text-muted-foreground text-sm">{error.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Все три — это не психология<br /><br />
              Это отсутствие системы
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
