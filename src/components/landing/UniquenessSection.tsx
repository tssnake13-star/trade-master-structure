const UniquenessSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-foreground">
            Почему опытные трейдеры продолжают терять деньги
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Вас учили входам, но не учили принимать решения.
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Вас учили сделкам, но не учили, когда не торговать.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              В итоге каждая позиция — это стресс и сомнение.
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Проблема не в психологии.<br />
              Проблема в отсутствии протокола.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniquenessSection;
