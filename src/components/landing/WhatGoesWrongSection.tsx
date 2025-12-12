const WhatGoesWrongSection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Что именно идёт не так
          </h2>
          
          <div className="mt-10 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-secondary/30 rounded-xl border border-border">
                <p className="text-muted-foreground text-sm uppercase tracking-wider mb-3">Большинство</p>
                <p className="text-lg text-foreground">ищут точку входа</p>
              </div>
              <div className="p-6 bg-accent/30 rounded-xl border border-border">
                <p className="text-muted-foreground text-sm uppercase tracking-wider mb-3">Профессионалы</p>
                <p className="text-lg text-foreground">сначала определяют фазу рынка</p>
              </div>
            </div>
            
            <div className="divider" />
            
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Рынок движется не от уровня.
              </p>
              <p className="text-lg text-foreground">
                Он движется от фазы к фазе:
              </p>
              <div className="flex flex-wrap items-center gap-3 text-mono text-muted-foreground">
                <span className="px-3 py-1.5 bg-secondary rounded-md">накопление</span>
                <span className="text-muted-foreground/50">→</span>
                <span className="px-3 py-1.5 bg-secondary rounded-md">выход</span>
                <span className="text-muted-foreground/50">→</span>
                <span className="px-3 py-1.5 bg-secondary rounded-md">тест</span>
                <span className="text-muted-foreground/50">→</span>
                <span className="px-3 py-1.5 bg-secondary rounded-md">тренд</span>
              </div>
            </div>
            
            <p className="text-lg text-foreground/80 pt-4">
              Пока нет понимания фаз — торговля остаётся случайной.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatGoesWrongSection;
