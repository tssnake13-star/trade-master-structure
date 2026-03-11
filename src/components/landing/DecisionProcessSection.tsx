const DecisionProcessSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Задача трейдера — не искать сделки. Задача трейдера — разрешать их системой.
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              В большинстве торговых систем решение принимает человек. Поэтому результат зависит от эмоций, страха и желания быть в рынке.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              В TRADELIKETYO каждая сделка проходит через последовательность фильтрации.
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Сначала анализируется структура рынка. Затем формируется сценарий. После этого ждём подтверждение. И только потом появляется зона входа.
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Если хотя бы один элемент отсутствует — сделка запрещена.
            </p>
            <p className="mt-2 text-foreground font-medium">
              Задача трейдера не искать сделки. Задача трейдера — разрешать их системой.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DecisionProcessSection;
