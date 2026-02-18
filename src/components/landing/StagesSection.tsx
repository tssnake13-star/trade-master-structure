const stages = [
  {
    number: '01',
    label: 'Фундамент',
    title: 'Фундамент',
    lines: [
      'Изучение структуры, накопления, последней трендовой свечи и зон синхронизации.',
      'Формируем единый язык алгоритма.',
      'Без фундамента к практике не переходим.',
    ],
  },
  {
    number: '02',
    label: 'Контролируемая практика',
    title: 'Контролируемая практика',
    lines: [
      'Работа с готовыми сделками и датами.',
      'Повторение и разбор логики входа.',
      'Переход от понимания к реальному чтению графика.',
    ],
  },
  {
    number: '03',
    label: 'Самостоятельное чтение рынка',
    title: 'Самостоятельное чтение рынка',
    lines: [
      'Получаете только дату — без подсказок.',
      'Сами определяете структуру и сценарий.',
      'Формируется независимое мышление.',
    ],
  },
  {
    number: '04',
    label: 'Насмотренность и фильтрация',
    title: 'Насмотренность и фильтрация',
    lines: [
      'Работа в симуляторе.',
      'Поиск только тех ситуаций, которые соответствуют алгоритму.',
      'Отсев случайных входов.',
    ],
  },
  {
    number: '05',
    label: 'Анализ реального рынка',
    title: 'Анализ реального рынка',
    lines: [
      'Еженедельные обзоры ключевых инструментов.',
      'Отбор пар по принципу 2 из 3 критериев.',
      'Работа только с разрешёнными сценариями.',
    ],
  },
];

const StagesSection = () => {
  return (
    <section id="stages" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            5 этапов, через которые проходит каждый трейдер в TRADE OS
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            От теории к самостоятельному анализу реального рынка.
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
            После прохождения всех этапов формируется системное мышление, дисциплина и способность работать только с сильными ситуациями. Без хаоса. Только структура и алгоритм.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;
