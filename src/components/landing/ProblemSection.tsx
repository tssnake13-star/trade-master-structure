import { X } from 'lucide-react';

const problems = [
  'входят, чтобы снять тревогу, а не потому что было условие',
  'догоняют движение из страха упустить',
  'путают коррекцию и разворот, потому что нет сценария отмены',
  'меняют правила после убытка, пытаясь вернуть контроль',
];

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Почему большинство трейдеров теряют деньги снова и снова?
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
              Без сценария вы не торгуете. Вы реагируете.
            </p>
            <p className="text-muted-foreground mt-2">
              Реакция почти всегда заканчивается потерей денег и нервов.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;