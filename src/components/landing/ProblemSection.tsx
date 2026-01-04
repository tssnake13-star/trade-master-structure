import { X } from 'lucide-react';

const fatalErrors = [
  {
    number: '01',
    title: 'Вход без контекста',
    description: 'Ты не видишь фазу рынка. Входишь в случайной точке и молишься.',
  },
  {
    number: '02',
    title: 'Торговля эмоциями',
    description: 'Страх упустить. Желание отыграться. Азарт. Это не стратегия.',
  },
  {
    number: '03',
    title: 'Нет сценария отмены',
    description: 'Ты не знаешь, когда выходить. Передерживаешь убыток, режешь прибыль.',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-16 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            3 фатальные ошибки твоего входа
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Пока ты не устранишь их, депозит будет сливаться.
          </p>
          
          <div className="mt-10 grid md:grid-cols-3 gap-4 md:gap-6">
            {fatalErrors.map((error, index) => (
              <div
                key={index}
                className="p-5 md:p-6 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <X className="w-5 h-5 text-destructive/70 flex-shrink-0" />
                  <span className="text-mono text-sm text-muted-foreground">{error.number}</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{error.title}</h3>
                <p className="text-muted-foreground text-sm">{error.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-10 p-5 md:p-6 bg-secondary/50 border-l-2 border-foreground/30 rounded-r-lg">
            <p className="text-foreground font-medium">
              Решение есть. Но это не сигналы и не угадывание.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Это алгоритм. Чёткий. Системный. Профессиональный.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;