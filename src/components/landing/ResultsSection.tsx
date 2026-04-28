import { Check } from 'lucide-react';

const results = [
  'Рынок становится понятным',
  'Сделок становится меньше',
  'Но каждая из них имеет основание',
  'Уходит хаос, уходит спешка, уходит давление',
];

const ResultsSection = () => {
  return (
    <section id="results" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">10 · Результат</span>
          <h2 className="text-foreground">
            Что вы <em>начинаете</em> <span className="mute">видеть</span>
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
