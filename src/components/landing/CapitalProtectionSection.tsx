const limits = [
  { n: '0.25–0.3%', l: 'риск на сделку' },
  { n: '~4%', l: 'лимит на неделю' },
  { n: '~8%', l: 'лимит на месяц' },
  { n: 'Авто-стоп', l: 'блок при превышении' },
];

const CapitalProtectionSection = () => {
  return (
    <section id="protection" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Защита капитала</span>
          <h2 className="text-foreground">
            Плохая неделя не <em>превращается</em> в плохой месяц
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Risk Sentinel следит за риском в реальном времени. Если потенциальные убытки по всем позициям превышают лимит — новые сделки блокируются автоматически.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {limits.map((x) => (
            <div key={x.l} className="border border-border rounded-xl bg-card p-5">
              <div className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl tracking-tight tabular-nums" style={{ color: 'hsl(var(--cool))' }}>{x.n}</div>
              <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-2">{x.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CapitalProtectionSection;
