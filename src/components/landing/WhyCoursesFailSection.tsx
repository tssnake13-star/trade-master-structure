const steps = [
  'Контекст рынка',
  'Сценарий',
  'Подтверждение',
  'Зона входа',
];

const WhyCoursesFailSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Почему обычные курсы трейдинга не работают
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Большинство курсов учат искать вход. Но прибыльная торговля строится не на входах. Она строится на фильтрации ситуаций. 90% рынка нужно пропускать. Работают только те сделки, которые разрешены системой.
            </p>
          </div>

          <ul className="mt-6 md:mt-8 space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center gap-3 text-sm md:text-base text-foreground">
                <span className="text-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Если условия не совпали — сделки нет.<br />
              Правила важнее желания быть в рынке.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyCoursesFailSection;
