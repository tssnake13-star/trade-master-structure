import { Check } from 'lucide-react';

const results = [
  'начинаете видеть фазы рынка, а не отдельные свечи',
  'перестаёте входить в середине импульса',
  'учитесь фильтровать рыночный шум',
  'спокойно пропускаете слабые сделки',
  'входите только в сделки с потенциалом не ниже 1:5',
  'правила становятся важнее эмоций',
];

const ResultsSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Что меняется в вашем подходе к рынку?
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
