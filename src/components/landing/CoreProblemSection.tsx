const errors = [
  { n: '01', t: 'Вход без подтверждения', d: 'Сделка открывается раньше, чем структура её разрешила.' },
  { n: '02', t: 'Сомнение после входа', d: 'Позиция закрывается раньше времени — на эмоции, а не по плану.' },
  { n: '03', t: 'Попытка отыграться', d: 'Новый вход без допуска, чтобы вернуть потерянное.' },
];

const CoreProblemSection = () => {
  return (
    <section id="problem" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">01 · Проблема</span>
          <h2 className="text-foreground">
            Дело не в <em>стратегии</em>
          </h2>

          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              У большинства трейдеров с опытом есть знания, понимание рынка и хорошие сделки.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Но в ключевой момент происходит одно и то же: сомнение, импульс, вход на эмоциях. Один такой период — и результат нескольких месяцев уничтожен.
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Проблема не в стратегии. Проблема в том, что нет механизма, который говорит ДА или НЕТ — и которому можно доверять.
            </p>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-3">
          {errors.map((e) => (
            <div key={e.n} className="border border-border rounded-xl bg-card p-5">
              <div className="font-['Martian_Mono'] text-[11px] tracking-[0.2em]" style={{ color: 'hsl(var(--accent))' }}>{e.n}</div>
              <div className="font-['Bricolage_Grotesque'] text-xl mt-2 text-foreground">{e.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{e.d}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-base md:text-lg text-foreground font-medium">
          Все три — это не психология. Это отсутствие системы.
        </p>
      </div>
    </section>
  );
};

export default CoreProblemSection;
