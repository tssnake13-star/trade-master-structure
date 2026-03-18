const UniquenessSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-foreground">
            Почему даже опыт не спасает
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Вы уже были в рынке<br />
              видели движение<br />
              делали прибыльные сделки
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Но стабильности нет
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Потому что каждое решение принимается заново
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Нет единой системы<br />
              которая держит вас в рамках
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniquenessSection;
