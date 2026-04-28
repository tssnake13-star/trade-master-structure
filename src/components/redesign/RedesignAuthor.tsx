/**
 * Editorial author block — large 4:5 portrait left, drop-cap manifest right.
 * Keeps original copy from AuthorSection but reflows it as a single editorial column.
 */
const RedesignAuthor = () => {
  return (
    <section id="author" className="reveal py-20 md:py-32">
      <div className="container-landing">
        <div className="kicker mb-10 md:mb-16">
          <span className="num">012</span>
          <span className="dot">·</span>
          <span>AUTHOR · СИСТЕМНЫЙ АРХИТЕКТОР</span>
        </div>

        <div className="grid md:grid-cols-12 gap-8 md:gap-14 items-start">
          {/* Portrait — dominates */}
          <div className="md:col-span-5">
            <div className="aspect-[4/5] overflow-hidden bg-secondary rounded-sm border border-[hsl(var(--rule-soft))]">
              <img
                src="/lovable-uploads/b039968f-d8a6-42e3-9c62-6ee1e7af3057.jpg"
                alt="Сергей Тё — архитектор торговых систем"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-[hsl(var(--rule-soft))] pt-3">
              <p className="font-['Fraunces'] text-xl text-foreground tracking-tight">Сергей Тё</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
                FIG_05 · PORTRAIT
              </p>
            </div>
          </div>

          {/* Manifest */}
          <div className="md:col-span-7 md:pt-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono mb-6">
              MANIFESTO · 012.A
            </p>

            <p className="drop-cap text-lg md:text-xl text-foreground leading-[1.55] mb-8">
              Я не учу искать входы. Я выстраиваю систему, которая принимает решение
              за вас — раньше, чем вы успеете включить эмоции.
            </p>

            <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed border-l border-[hsl(var(--warm)/0.4)] pl-6">
              <p>
                Это другой уровень работы. Где вы перестаёте действовать на ощущениях
                и начинаете действовать по структуре.
              </p>
              <p className="text-foreground">
                Архитектор торговых систем. Не автор сигналов. Не наставник.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[hsl(var(--rule-soft))] pt-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono mb-1">Роль</p>
                <p className="font-['Fraunces'] text-foreground">Архитектор</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono mb-1">Метод</p>
                <p className="font-['Fraunces'] text-foreground">Структура</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono mb-1">Принцип</p>
                <p className="font-['Fraunces'] text-foreground italic">Допуск</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RedesignAuthor;