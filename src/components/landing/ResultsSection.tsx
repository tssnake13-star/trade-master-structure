import { Check } from 'lucide-react';

const results = [
  'Решение по условиям, не по импульсу',
  'Вход только при совпадении сценария',
  'Пропуск — часть системы',
  'Правила важнее ситуации',
];

const ResultsSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Что меняется
          </h2>
          
          <ul className="mt-6 md:mt-8 space-y-3">
            {results.map((result, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 text-base text-muted-foreground"
              >
                <Check className="w-4 h-4 text-foreground mt-1 flex-shrink-0" />
                <span>{result}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
