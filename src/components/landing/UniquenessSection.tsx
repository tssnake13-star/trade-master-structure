const UniquenessSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-foreground">
            Почему большинство трейдеров остаются в хаосе
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Вас учат входам, но не учат думать.
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Вас учат сделкам, но не учат, когда не входить.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Поэтому каждая сделка — стресс.
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Здесь вы учитесь принимать решения по одному протоколу.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniquenessSection;
