import { X } from 'lucide-react';

const fatalErrors = [
  {
    number: '01',
    title: 'Отсутствие контекста',
    description: 'Вы принимаете решение, не понимая фазу рынка.',
  },
  {
    number: '02',
    title: 'Работа без сценария',
    description: 'Нет точки отмены — значит решение всегда эмоциональное.',
  },
  {
    number: '03',
    title: 'Импульсные входы',
    description: 'Страх и желание отыграться подменяют систему.',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            3 фатальные ошибки Вашего входа
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
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
