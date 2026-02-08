const stages = [
  {
    number: '01',
    label: 'Установка Ядра',
    title: 'Базовая прошивка',
    description: 'Установка структуры и логики. Выход на осознанный пропуск сделок.',
  },
  {
    number: '02',
    label: 'Конфигурация сценариев',
    title: 'Настройка модулей',
    description: 'Настройка модулей фона и логики отмены сценария.',
  },
  {
    number: '03',
    label: 'Эксплуатация (OS)',
    title: 'Режим оператора',
    description: 'Переход в режим оператора системы. Дистанция, основанная на дисциплине алгоритма, а не на поиске «идеального входа».',
  },
];

const StagesSection = () => {
  return (
    <section id="stages" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Этапы развёртывания системы
          </h2>
          
          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {stages.map((stage, index) => (
              <div
                key={index}
                className="p-5 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mono text-xs text-muted-foreground">{stage.number}</span>
                  <span className="text-mono text-xs text-foreground/60">{stage.label}</span>
                </div>
                <h3 className="text-sm md:text-base font-medium text-foreground mb-1">{stage.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;
