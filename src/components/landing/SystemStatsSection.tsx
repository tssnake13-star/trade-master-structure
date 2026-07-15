const stats = [
  { n: '+112.1%', l: 'доходность · 18 мес' },
  { n: '2.85', l: 'profit factor' },
  { n: '−2.23%', l: 'макс. просадка' },
  { n: '15/18', l: 'прибыльных месяцев' },
  { n: '319', l: 'сделок за 18 мес' },
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
            Статистика системы за 18 месяцев — 319 сделок. Риск 0.25% на сделку, без компаундинга.
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
            <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--accent))' }}>Profit Factor 2.85</div>
            <p className="mt-2 text-sm text-muted-foreground">На каждый потерянный $1 система возвращает $2.85. Результат на фиксированном риске — не «разгон депозита», а устойчивая работа.</p>
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
