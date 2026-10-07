const items = [
  {
    tag: 'Стратегия',
    name: 'Trade Master',
    // Четыре шага раскрыты отдельным блоком ниже («09 · Четыре вопроса») —
    // здесь только назначение, иначе одно и то же идёт двумя экранами подряд.
    desc: 'Авторская система. Ситуация проходит четыре вопроса — и получает допуск или отказ. Прошла — можно войти. Не прошла — сделки нет.',
  },
  {
    tag: 'Допуск',
    name: 'Echo Gate',
    desc: 'Фильтр входов. Присылает готовый ответ по ситуации: допуск или отказ. Решение всегда остаётся за вами.',
  },
  {
    tag: 'Исполнение',
    name: 'Hunter Bot · Risk Sentinel',
    desc: 'Hunter Bot открывает и ведёт сделку по вашему распоряжению. Risk Sentinel держит риск в рамках и блокирует торговлю, если лимит недели или месяца превышен.',
  },
];

const IncludedSection = () => {
  return (
    <section id="included" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">08 · Что входит</span>
          <h2 className="text-foreground">
            Стратегия, допуск, исполнение — <em>одна система</em>
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

        {/* 07.10.2026: подписка для всех, роботы работают в ней и без обучения */}
        <p className="mt-6 text-sm md:text-base text-muted-foreground max-w-3xl">
          Echo Gate, Hunter Bot и Risk Sentinel работают в подписке ECHO-GATE INSIDE, и обучение
          для неё не нужно: один урок «Точка входа», дальше от вас 2 действия. Хотите понять
          систему сами, начните с курса или практикума.
        </p>
      </div>
    </section>
  );
};

export default IncludedSection;
