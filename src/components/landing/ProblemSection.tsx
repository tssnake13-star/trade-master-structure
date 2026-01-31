import { X, ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const fatalErrors = [
  {
    number: '01',
    title: 'Отсутствие контекста',
    description: 'Вы не видите фазу рынка. Входите в случайной точке.',
  },
  {
    number: '02',
    title: 'Работа без сценария',
    description: 'Нет плана. Нет точки отмены. Решения на эмоциях.',
  },
  {
    number: '03',
    title: 'Эмоциональные входы',
    description: 'Страх упустить. Желание отыграться. Азарт.',
  },
];

const ProblemSection = () => {
  return (
    <section className="py-16 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            3 фатальные ошибки Вашего входа
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Пока Вы не устраните их — депозит будет сливаться.
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
          
          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              Проверить свою ошибку во входе
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
            >
              Разобрать мою ситуацию с Сергеем Тё
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;