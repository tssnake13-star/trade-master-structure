import Words from '@/components/fx/Words';
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
      'Не нужна и не появляется',
    ],
  },
  {
    title: 'Обычное обучение',
    accent: false,
    values: [
      'Вы сами, под эмоциями',
      'Конспекты и теория',
      'Сила воли',
      'Держится на мотивации',
    ],
  },
  {
    title: 'Бинокль',
    accent: true,
    values: [
      'Программа проверяет, я даю вердикт с причиной',
      'Подписка работает на свой срок. Изучите систему, и она останется вашей',
      'Страж счёта останавливает новые сделки на лимите',
      'Встроена в исполнение: сделку ведёт робот',
    ],
  },
];

const ACCENT = 'hsl(var(--accent))';

const ComparisonSection = () => {
  return (
    <section id="difference" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground">
            <Words>Это не сигналы. И не очередное обучение.</Words>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Обычно сравнивают три варианта. Разница по сути:
          </p>
        </div>

        <div className="mt-8 md:mt-12 grid md:grid-cols-3 gap-3 md:gap-4">
          {columns.map((col) => (
            <div
              key={col.title}
              data-beam={col.accent ? '' : undefined}
              className="rounded-md p-5 md:p-6 border bg-card"
              style={
                col.accent
                  ? { borderColor: ACCENT, background: `linear-gradient(180deg, hsl(var(--accent) / 0.08) 0%, hsl(var(--card)) 70%)` }
                  : { borderColor: 'hsl(var(--border))' }
              }
            >
              <div
                className="font-ui text-[12.5px] tracking-[0.01em] mb-5"
                style={{ color: col.accent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
              >
                {col.title}
              </div>
              <ul className="space-y-4">
                {col.values.map((v, i) => (
                  <li key={i}>
                    <div className="font-ui text-[12.5px] tracking-[0.01em] text-muted-foreground/60 mb-1">
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
          Поэтому здесь безопаснее: я торгую с риском 0,25% на сделку, максимальная просадка
          за 21 месяц <span className="text-foreground">2,23%</span>. Ваш риск выбираете вы.
        </p>
      </div>
    </section>
  );
};

export default ComparisonSection;
