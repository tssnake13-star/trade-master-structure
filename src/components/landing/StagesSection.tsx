const stages = [
  {
    number: '01',
    title: 'Фундамент',
    description: 'Понимание фаз. Структура вместо хаоса.',
  },
  {
    number: '02',
    title: 'Сценарии',
    description: 'Логика входа и пропуска.',
  },
  {
    number: '03',
    title: 'Практика',
    description: 'Дисциплина важнее импульса.',
  },
  {
    number: '04',
    title: 'Самостоятельная торговля',
    description: 'Решения по системе, без подсказок.',
  },
  {
    number: '05',
    title: 'Дистанция',
    description: 'Стабильность важнее количества.',
  },
];

const StagesSection = () => {
  return (
    <section id="stages" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Путь внедрения системы
          </h2>
          
          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-5 gap-3">
            {stages.map((stage, index) => (
              <div
                key={index}
                className="p-4 bg-card border border-border rounded-xl"
              >
                <span className="text-mono text-xs text-muted-foreground">{stage.number}</span>
                <h3 className="text-sm font-medium text-foreground mt-1 mb-1">{stage.title}</h3>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;
