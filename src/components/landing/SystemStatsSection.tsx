const stats = [
  { n: '+85.6%', l: 'доходность · 17 мес' },
  { n: '2.50', l: 'profit factor' },
  { n: '−2.23%', l: 'макс. просадка' },
  { n: '14/17', l: 'прибыльных месяцев' },
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
            Статистика системы за 17 месяцев — 299 сделок. Риск 0.25% на сделку, без компаундинга.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.l} className="border border-border rounded-xl bg-card p-5">
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
            <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--accent))' }}>Profit Factor 2.50</div>
            <p className="mt-2 text-sm text-muted-foreground">На каждый потерянный $1 система возвращает $2.50. Результат на фиксированном риске — не «разгон депозита», а устойчивая работа.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemStatsSection;
