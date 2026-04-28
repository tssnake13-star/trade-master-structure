const filters = [
  'Контекст рынка',
  'Сценарий',
  'Подтверждение',
  'Совпадение условий',
];

const FiltrationSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Фильтрация</span>
          <h2 className="text-foreground">
            <em>Фильтрация</em> <span className="mute">торговых ситуаций</span>
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Рынок ежедневно показывает сотни движений. Но большинство из них не имеют системной структуры.
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Поэтому ключевая задача трейдера — не искать возможности, а отсекать слабые ситуации.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              В TRADELIKETYO используется принцип строгой фильтрации.
            </p>
          </div>

          <ul className="mt-6 md:mt-8 space-y-2">
            {filters.map((item, index) => (
              <li key={index} className="flex items-center gap-3 text-sm md:text-base text-foreground">
                <span className="text-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          
          <p className="mt-6 md:mt-8 text-base md:text-lg text-foreground font-medium">
            Минимум входов. Максимум качества.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FiltrationSection;
