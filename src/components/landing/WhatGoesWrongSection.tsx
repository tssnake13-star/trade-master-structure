const WhatGoesWrongSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Если вы не понимаете фазу рынка — каждая сделка превращается в угадывание.
          </h2>
          
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            Поэтому сначала определяется фаза, потом принимается решение.
          </p>
          
          <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-2 md:gap-3">
            <span className="px-3 py-1.5 bg-secondary rounded-md text-sm text-muted-foreground">накопление</span>
            <span className="text-muted-foreground/50">→</span>
            <span className="px-3 py-1.5 bg-secondary rounded-md text-sm text-muted-foreground">выход</span>
            <span className="text-muted-foreground/50">→</span>
            <span className="px-3 py-1.5 bg-secondary rounded-md text-sm text-muted-foreground">тест</span>
            <span className="text-muted-foreground/50">→</span>
            <span className="px-3 py-1.5 bg-secondary rounded-md text-sm text-muted-foreground">тренд</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatGoesWrongSection;
