/**
 * Пять этапов подготовки — настоящее устройство обучения, записанное
 * со слов Сергея 02.09.2026 (`TRADELIKETYO/УСТРОЙСТВО ОБУЧЕНИЯ — 5 этапов.md`).
 *
 * Этот блок объясняет разницу между уровнями честнее любых текстов:
 * на курсе этапов нет вовсе, на практикуме до пятого за два месяца
 * обычно не доходят, за год проходят все пять.
 *
 * ⚠️ Терминов алгоритма здесь быть не должно: названия шагов отдаются
 * только тем, кто уже купил. Публично — суть своими словами.
 * ⚠️ Замечание про симулятор («подгоняем ситуацию под алгоритм») в контент
 * не идёт ни в каком виде — прямой запрет Сергея.
 */

const GOLD = 'hsl(var(--accent))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };

const STAGES = [
  {
    n: '01',
    title: 'Теория',
    text: 'Блок за блоком, по одному за раз. На блок сутки, при необходимости двое. К эфирам не привязано — смотрите, когда есть время. После каждого блока домашнее задание: проверяю лично и поправляю, пока не станет понятно.',
  },
  {
    n: '02',
    title: 'Тренировки по готовым сделкам',
    text: 'Даю готовую сделку. Вы повторяете её и понимаете, почему она вообще существует. Около 5 сделок — здесь ломается привычка угадывать.',
  },
  {
    n: '03',
    title: 'Только дата',
    text: 'Даю дату — без направления, без скринов, без подсказок. Сделку вы делаете сами. Столько раз, сколько нужно, чтобы я увидел: вы понимаете, что делаете.',
  },
  {
    n: '04',
    title: 'Самостоятельный поиск',
    text: 'Вы сами ищете ситуации и разбираете их. Минимум 50 тренировок перед выходом на реальный рынок. Самый длинный этап, и на нём становится видно всё.',
  },
  {
    n: '05',
    title: 'Реальный рынок',
    text: 'Каждую неделю — полноценный обзор по основным инструментам. Тренировки продолжаются параллельно: рынок вы читаете уже своим опытом, а не чужим объяснением.',
  },
];

const LEVELS: { name: string; price?: string; alwaysPrice?: boolean; text: string }[] = [
  {
    name: 'Trade System',
    price: '$349',
    alwaysPrice: true,
    text: 'Этапов здесь нет. Вы получаете саму систему и проходите её сами, без проверки заданий и без тренировок под моим контролем.',
  },
  {
    name: 'Практикум',
    price: '$499',
    alwaysPrice: true,
    text: 'Этапы начинаются. За два месяца до пятого обычно не доходят — четвёртый самый длинный, и я говорю об этом сразу. Реалистично вы доходите до четвёртого и точно знаете, что делать дальше.',
  },
  {
    name: 'Trade OS Plus',
    price: '$1599',
    text: 'Все пять этапов до конца и выход на реальный рынок.',
  },
];

export default function FiveStagesSection({
  showPrices,
  label = '12 · Путь',
  asSection = true,
}: { showPrices: boolean; label?: string; asSection?: boolean }) {
  const body = (
    <>
      <div className="max-w-3xl">
        {asSection && <span className="section-label">{label}</span>}
        {!asSection && <div className="text-mono" style={{ ...MONO, color: GOLD }}>Путь из пяти этапов</div>}
        {asSection && (
          <h2 className="text-foreground">
            Путь из <em>пяти этапов</em>
          </h2>
        )}
        <p className={asSection ? 'mt-4 text-base md:text-lg text-muted-foreground' : 'mt-3 text-sm text-muted-foreground'} style={{ maxWidth: '60ch' }}>
          Одинаковый для всех, кто идёт со мной. Разница между уровнями в том, докуда вы по нему доходите.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((s) => (
          <div key={s.n} className="p-5" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <div className="flex items-baseline gap-2.5">
              <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, fontSize: 30, lineHeight: 1, color: GOLD }}>{s.n}</span>
              <span className="text-base text-foreground font-medium">{s.title}</span>
            </div>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
          </div>
        ))}

        <div className="p-5" style={{ border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)' }}>
          <div className="text-mono" style={{ ...MONO, color: GOLD }}>Докуда вы доходите</div>
          <div className="mt-3 space-y-3">
            {LEVELS.map((l) => (
              <div key={l.name}>
                <div className="text-sm text-foreground font-medium">
                  {l.name}
                  {(showPrices || l.alwaysPrice) && l.price && (
                    <span className="text-mono ml-2" style={{ ...MONO, letterSpacing: '0.12em', color: GOLD }}>{l.price}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (!asSection) return <div>{body}</div>;

  return (
    <section id="stages" className="section-animate py-12 md:py-20">
      <div className="container-landing">{body}</div>
    </section>
  );
}
