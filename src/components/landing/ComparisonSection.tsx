/**
 * ComparisonSection — «07 · Отличие». Прямая отстройка от альтернатив, с которыми
 * сравнивает опытный трейдер: сигнальные каналы и «ещё один курс». Три колонки
 * по четырём одинаковым критериям; колонка системы выделена золотом. Закрывается
 * аргументом безопасности (фикс-риск + просадка).
 */

const CRITERIA = ['Кто говорит сделке «да»', 'Что остаётся через год', 'Кто следит за риском', 'Дисциплина'];

const columns = [
  {
    title: 'Сигналы',
    accent: false,
    values: [
      'Чужой человек в канале',
      'Зависимость от канала',
      'Никто',
      'Не нужна — и не появляется',
    ],
  },
  {
    title: 'Обычное обучение',
    accent: false,
    values: [
      'Вы сами — под эмоциями',
      'Конспекты и теория',
      'Сила воли',
      'Держится на мотивации',
    ],
  },
  {
    title: 'Система TLT',
    accent: true,
    values: [
      'Алгоритм допуска — Echo Gate',
      'Система решений + роботы на счёте',
      'Risk Sentinel: −4% в неделю → блок',
      'Встроена в исполнение',
    ],
  },
];

const ACCENT = 'hsl(var(--accent))';

const ComparisonSection = () => {
  return (
    <section id="difference" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">07 · Отличие</span>
          <h2 className="text-foreground">
            Это не <em>сигналы</em>. И не <span className="mute">«ещё один курс»</span>.
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Опытные трейдеры обычно выбирают из трёх путей. Разница — по сути:
          </p>
        </div>

        <div className="mt-8 md:mt-12 grid md:grid-cols-3 gap-3 md:gap-4">
          {columns.map((col) => (
            <div
              key={col.title}
              className="rounded-xl p-5 md:p-6 border bg-card"
              style={
                col.accent
                  ? { borderColor: ACCENT, background: `linear-gradient(180deg, hsl(var(--accent) / 0.08) 0%, hsl(var(--card)) 70%)` }
                  : { borderColor: 'hsl(var(--border))' }
              }
            >
              <div
                className="font-['Martian_Mono'] text-[11px] uppercase tracking-[0.2em] mb-5"
                style={{ color: col.accent ? ACCENT : 'hsl(var(--muted-foreground))' }}
              >
                {col.title}
              </div>
              <ul className="space-y-4">
                {col.values.map((v, i) => (
                  <li key={i}>
                    <div className="font-['Martian_Mono'] text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 mb-1">
                      {CRITERIA[i]}
                    </div>
                    <div className={`text-sm md:text-[15px] ${col.accent ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {v}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-base md:text-lg text-foreground font-medium" style={{ maxWidth: '64ch' }}>
          Поэтому здесь безопаснее: риск фиксирован — 0.25% на сделку, максимальная просадка
          за 18 месяцев — <span style={{ color: ACCENT }}>2.23%</span>.
        </p>
      </div>
    </section>
  );
};

export default ComparisonSection;
