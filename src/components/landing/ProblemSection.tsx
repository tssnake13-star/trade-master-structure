import { X } from 'lucide-react';

const problems = [
  'торгуют хаос, а не сценарий',
  'входят в середине импульса',
  'путают коррекцию и разворот',
  'меняют стратегии каждую неделю',
];

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Почему 95% трейдеров сливают
          </h2>
          
          <ul className="mt-10 space-y-5">
            {problems.map((problem, index) => (
              <li 
                key={index}
                className="flex items-start gap-4 text-lg text-muted-foreground"
              >
                <X className="w-5 h-5 text-muted-foreground/50 mt-1 flex-shrink-0" />
                <span>{problem}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-12 p-6 bg-secondary/50 border-l-2 border-muted-foreground/30 rounded-r-lg">
            <p className="text-lg text-foreground font-medium">
              Работа без сценария → неизбежный слив.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
