const week = [
  { d: 'Воскресенье', t: '30 минут на анализ', s: 'контекст рынка на неделю' },
  { d: 'Понедельник', t: 'Скринер отбирает', s: 'куда смотреть на неделе' },
  { d: 'Вторник–пятница', t: 'Система работает', s: 'вы занимаетесь своей жизнью' },
];

const WorkWeekSection = () => {
  return (
    <section id="week" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Рабочая неделя</span>
          <h2 className="text-foreground">
            Система работает. <em>Вы живёте.</em>
          </h2>
        </div>

        <div className="mt-8 md:mt-10 max-w-3xl">
          {week.map((w) => (
            <div key={w.d} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5 py-5 border-b border-border">
              <span className="font-['Martian_Mono'] text-xs uppercase tracking-[0.14em] sm:min-w-[170px]" style={{ color: 'hsl(var(--accent))' }}>{w.d}</span>
              <span>
                <span className="font-['Bricolage_Grotesque'] text-xl text-foreground">{w.t}</span>
                <span className="text-muted-foreground text-base"> — {w.s}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkWeekSection;
