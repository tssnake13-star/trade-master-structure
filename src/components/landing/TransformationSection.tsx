/**
 * «03 · Неделя по системе» (файл прежний — TransformationSection).
 *
 * ⚠️ Переписан 13.09.2026 под «ПОРТРЕТ КЛИЕНТА.md». Это главное объяснение
 * УТП простым языком: как свинг-торговля помещается рядом с основной работой.
 * Три шага недели — факты из FAQ автора (выходные 30–60 минут, в будни
 * короткая проверка, выход и стоп известны до входа — это «Где выходить»
 * из четырёх вопросов). Минуты на будничную проверку НЕ называем:
 * число не подтверждено.
 *
 * Здесь «что», а не «как»: ни одного условия входа по содержанию.
 *
 * id секции сменён с `transformation` на `week` — прежняя аналитика по старому
 * блоку остаётся в базе под старым id.
 */

const WEEK = [
  {
    when: 'Выходные · 30–60 минут',
    title: 'Разбор рынка',
    text: 'Отбираете инструменты, где ждать сделку. Здесь и принимается решение, что брать.',
  },
  {
    when: 'Будни · короткая проверка',
    title: 'Условие или нет',
    text: 'Смотрите, наступило ли условие входа. Нет условия — нет сделки, и думать больше не о чем.',
  },
  {
    when: 'Сделка · живёт днями',
    title: 'Исполнение',
    text: 'Уровень выхода и стоп известны до входа. Следить за каждым движением не нужно.',
  },
];

const stops = [
  'Открываете сделку, когда показалось, что пора',
  'Ищете подтверждение уже после входа',
  'Сидите у графика в ожидании входа',
  'Берёте сделку, которой не было в вашем плане',
];

const gains = [
  'Каждая сделка имеет причину',
  'Каждый отказ тоже имеет причину',
];

const ACCENT = 'hsl(var(--accent))';

const TransformationSection = () => {
  return (
    <section id="week" className="section-animate py-16 md:py-24">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">03 · Неделя по системе</span>
          <h2 className="text-foreground">
            Как торговля помещается <em>рядом с работой</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Свинг на неделе и дневке. Сделка живёт днями, и сидеть у графика ради неё не нужно.
          </p>
        </div>

        {/* неделя в трёх шагах */}
        <div className="mt-10 md:mt-12 grid md:grid-cols-3 gap-3 max-w-5xl">
          {WEEK.map((w, i) => (
            <div key={w.title} className="border border-border rounded-xl bg-card p-5 md:p-6">
              <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                0{i + 1} · {w.when}
              </div>
              <div className="font-['Bricolage_Grotesque'] text-2xl mt-3 text-foreground">{w.title}</div>
              <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>

        {/* контраст: что уходит → что остаётся */}
        <div className="mt-12 md:mt-16 grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl">
          <div>
            <div className="section-label">Больше не</div>
            <ul className="space-y-4">
              {stops.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <span aria-hidden className="mt-1 flex-shrink-0 text-sm" style={{ color: 'hsl(var(--destructive))' }}>✕</span>
                  <span className="text-base md:text-lg text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:self-center md:border-l md:border-border md:pl-12">
            <div className="section-label" style={{ color: ACCENT, opacity: 1 }}>Теперь</div>
            <ul className="space-y-5">
              {gains.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <span aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}>✓</span>
                  <span className="text-xl md:text-2xl leading-snug text-foreground">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* центральный тезис проекта одной фразой */}
        <div
          className="mt-16 md:mt-24 max-w-4xl mx-auto text-center"
          style={{
            borderTop: '1px solid hsl(var(--border))',
            borderBottom: '1px solid hsl(var(--border))',
            paddingTop: '2.5rem',
            paddingBottom: '2.5rem',
          }}
        >
          <span className="section-label" style={{ display: 'inline-block' }}>
            Зачем и школа, и экосистема
          </span>
          <p className="font-['Bricolage_Grotesque'] text-3xl md:text-5xl leading-[1.12] tracking-tight text-foreground">
            Школа <em className="not-italic" style={{ color: ACCENT }}>учит</em> вас принимать решения.
            <br className="hidden md:block" />{' '}
            Экосистема <em className="not-italic" style={{ color: ACCENT }}>следит</em> за тем,
            чтобы вы их не нарушали.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TransformationSection;
