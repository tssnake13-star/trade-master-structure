// Срез таблицы «TLT_Statement_2025-2026» (январь 2025 — сентябрь 2026), обновлено 04.10.2026.
// Обновлять только отсюда.
const stats = [
  { n: '+136,0%', l: 'доходность · 21 мес' },
  { n: '2,92', l: 'profit factor' },
  { n: '−2,23%', l: 'макс. просадка' },
  { n: '18/21', l: 'прибыльных месяцев' },
  { n: '387', l: 'сделок за 21 мес' },
];

const SystemStatsSection = () => {
  return (
    <section id="stats" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">05 · Результаты системы</span>
          <h2 className="text-foreground">
            Цифры, которые <em>не зависят</em> от настроения
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Статистика системы за 21 месяц — 387 сделок. Риск 0,25% на сделку, без компаундинга.
            В среднем это 6,5% в месяц, при этом 3 месяца из 21 закрылись в минус.
            Прошлый результат не гарантирует будущий.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.map((s, i) => (
            <div
              key={s.l}
              className={`border border-border rounded-xl bg-card p-5 ${i === stats.length - 1 ? 'col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="font-['Bricolage_Grotesque'] text-3xl md:text-4xl tracking-tight tabular-nums text-foreground">{s.n}</div>
              <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-2">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="border border-border rounded-xl bg-card p-5">
            <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--accent))' }}>Win Rate 23,5% · R:R 9,5:1</div>
            <p className="mt-2 text-sm text-muted-foreground">Точка безубытка около 9,5%: при +9,5 R на прибыльную сделку и −1 R на стоп хватает одной прибыльной из десяти с половиной. Важно не как часто вы правы, а сколько берёте, когда правы.</p>
          </div>
          <div className="border border-border rounded-xl bg-card p-5">
            <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--accent))' }}>Profit Factor 2,92</div>
            <p className="mt-2 text-sm text-muted-foreground">На каждый потерянный $1 система возвращает $2,92. Результат на фиксированном риске — не «разгон депозита», а устойчивая работа.</p>
          </div>
        </div>

        <p className="mt-6 pt-4 border-t border-border/50 text-xs leading-relaxed text-muted-foreground/70 max-w-3xl">
          Прошлые результаты не гарантируют будущую доходность. Цифры приведены из личного журнала сделок автора за указанный период в образовательных целях и не являются индивидуальной инвестиционной рекомендацией. Торговля на финансовых рынках сопряжена с риском потери капитала.
        </p>
      </div>
    </section>
  );
};

export default SystemStatsSection;
