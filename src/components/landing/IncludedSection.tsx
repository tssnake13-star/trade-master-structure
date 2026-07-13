const items = [
  {
    tag: 'Стратегия',
    name: 'Trade Master',
    desc: 'Авторская система. Алгоритм из 4 шагов: контекст рынка → подтверждение сценария → точка входа → потенциал. Прошёл шаги — можно войти. Не прошёл — сделки нет.',
  },
  {
    tag: 'Анализ',
    name: 'Nexus Gravity',
    desc: 'Инструмент анализа, не сигналы. Когда два источника давят в одну сторону — вероятность хода выше. Дополнительный аргумент в пользу направления.',
  },
  {
    tag: 'Инфраструктура',
    name: 'Echo Gate',
    desc: 'Исполнение под ключ: скрининг, расчёт лота, ордер, сопровождение, контроль риска. Решение принимаете вы — исполнение берёт машина.',
  },
];

const IncludedSection = () => {
  return (
    <section id="included" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">08 · Что входит</span>
          <h2 className="text-foreground">
            Три компонента <em>одной системы</em>
          </h2>
        </div>

        <div className="mt-8 md:mt-10 grid md:grid-cols-3 gap-3">
          {items.map((i) => (
            <div key={i.name} className="border border-border rounded-xl bg-card p-6">
              <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--accent))' }}>{i.tag}</div>
              <div className="font-['Bricolage_Grotesque'] text-2xl mt-2 text-foreground">{i.name}</div>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IncludedSection;
