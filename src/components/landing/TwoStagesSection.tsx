const TwoStagesSection = () => {
  return (
    <section className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground">
            Два этапа.<br />
            <em>Одна траектория.</em>
          </h2>
        </div>

        <div className="mt-10 md:mt-14 relative grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <article
            className="p-6 md:p-8 flex flex-col"
            style={{ border: '1px solid hsl(var(--rule))' }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              01 · Обучение
            </div>
            <h3 className="mt-4 text-2xl md:text-3xl text-foreground">Школа</h3>
            <p className="mt-2 italic text-muted-foreground">
              Система допуска к сделке
            </p>
            <p className="mt-6 text-base md:text-lg text-muted-foreground">
              Для тех, кто торгует, но теряет на решениях. Перестраиваем мышление от угадывания к алгоритму. Три уровня программы — от базового до полного.
            </p>
            <div
              className="mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              Вход открыт
            </div>
          </article>

          {/* Connector */}
          <div
            aria-hidden
            className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none text-2xl"
            style={{ color: 'hsl(var(--accent))', opacity: 0.5 }}
          >
            →
          </div>

          {/* Card 2 */}
          <article
            className="p-6 md:p-8 flex flex-col"
            style={{ border: '1px solid hsl(var(--rule))' }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              02 · Инфраструктура
            </div>
            <h3 className="mt-4 text-2xl md:text-3xl text-foreground">Экосистема</h3>
            <p className="mt-2 italic text-muted-foreground">
              Профессиональная среда торговли
            </p>
            <p className="mt-6 text-base md:text-lg text-muted-foreground">
              Только для выпускников школы. Инструменты, которые автоматизируют исполнение — вы остаётесь стратегом. Echo-Gate, HunterBot, Risk Sentinel.
            </p>
            <div
              className="mt-8 text-[10px] uppercase tracking-[0.22em]"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: 'hsl(var(--accent))',
              }}
            >
              Доступ: выпускники
            </div>
          </article>
        </div>

        <p
          className="mt-10 md:mt-14 text-center italic"
          style={{
            fontFamily: "'Fraunces', 'Cormorant Garamond', Georgia, serif",
            fontSize: '20px',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          Школа учит думать как трейдер. Экосистема помогает работать как трейдер.
        </p>
      </div>
    </section>
  );
};

export default TwoStagesSection;
