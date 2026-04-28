const stages = [
  {
    number: '01',
    label: 'Структура',
    title: 'Понимание структуры',
    lines: [
      'Сначала вы понимаете, как устроен рынок.',
      'Без этого всё остальное — догадки.',
    ],
  },
  {
    number: '02',
    label: 'Чтение графика',
    title: 'Чтение на графике',
    lines: [
      'Учитесь видеть структуру на реальном графике.',
      'Переход от теории к практике.',
    ],
  },
  {
    number: '03',
    label: 'Фильтрация',
    title: 'Фильтрация входов',
    lines: [
      'Отсеиваете ситуации, где входить нельзя.',
      'Работаете только с допуском.',
    ],
  },
  {
    number: '04',
    label: 'Закрепление',
    title: 'Закрепление действий',
    lines: [
      'Повторение формирует навык.',
      'Решения перестают быть случайными.',
    ],
  },
  {
    number: '05',
    label: 'Стабильность',
    title: 'Стабильная работа',
    lines: [
      'И только после этого начинаете работать стабильно.',
      'Без хаоса. Только структура.',
    ],
  },
];

const StagesSection = () => {
  return (
    <section id="stages" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <span className="section-label">014 · Путь</span>
          <h2 className="text-foreground">
            Как <em>выстраивается</em> <span className="mute">система</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Шаг за шагом — от понимания к стабильной работе.
          </p>
          
          <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {stages.map((stage, index) => (
              <div
                key={index}
                className="p-5 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mono text-xs text-muted-foreground">{stage.number}</span>
                  <span className="text-mono text-xs text-foreground/60">{stage.label}</span>
                </div>
                <h3 className="text-sm md:text-base font-medium text-foreground mb-2">{stage.title}</h3>
                <ul className="space-y-1">
                  {stage.lines.map((line, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground leading-relaxed">
            Сначала вы понимаете структуру. Потом учитесь видеть её на графике. Дальше — фильтруете входы. Потом закрепляете действия. И только после этого начинаете работать стабильно.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;
