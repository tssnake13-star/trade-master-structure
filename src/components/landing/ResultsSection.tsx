import { Check } from 'lucide-react';

const results = [
  'Решение основано на условиях, а не на импульсе',
  'Вход только при совпадении сценария',
  'Пропуск — часть системы, а не потеря',
  'Точка отмены известна заранее',
  'Правила важнее ситуации',
  'Дисциплина вместо угадывания',
];

const ResultsSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Что меняется в работе с рынком?
          </h2>
          
          <ul className="mt-10 space-y-5">
            {results.map((result, index) => (
              <li 
                key={index}
                className="flex items-start gap-4 text-lg text-muted-foreground"
              >
                <Check className="w-5 h-5 text-foreground mt-1 flex-shrink-0" />
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