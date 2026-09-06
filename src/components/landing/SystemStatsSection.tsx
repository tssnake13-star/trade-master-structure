// Срез таблицы «TLT_Statement_Tactic1» от 05.09.2026. Обновлять только отсюда.
const stats = [
  { n: '+128,5%', l: 'доходность · 20 мес' },
  { n: '2,86', l: 'profit factor' },
  { n: '−2,23%', l: 'макс. просадка' },
  { n: '17/20', l: 'прибыльных месяцев' },
  { n: '377', l: 'сделок за 20 мес' },
];

const SystemStatsSection = () => {
  return (
    <section id="stats" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">04 · Результаты системы</span>
          <h2 className="text-foreground">
            Цифры, которые <em>не зависят</em> от настроения
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Статистика системы за 20 месяцев — 377 сделок. Риск 0,25% на сделку, без компаундинга.
            В среднем это 6,4% в месяц, при этом 3 месяца из 20 закрылись в минус.
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
            <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--accent))' }}>Win Rate 23% · R:R 10:1</div>
            <p className="mt-2 text-sm text-muted-foreground">Точка безубытка ~11%. Большинство думает, что нужно 70%+ побед — это миф. Важно не как часто ты прав, а сколько берёшь, когда прав.</p>
          </div>
          <div className="border border-border rounded-xl bg-card p-5">
            <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--accent))' }}>Profit Factor 2,86</div>
            <p className="mt-2 text-sm text-muted-foreground">На каждый потерянный $1 система возвращает $2,86. Результат на фиксированном риске — не «разгон депозита», а устойчивая работа.</p>
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
