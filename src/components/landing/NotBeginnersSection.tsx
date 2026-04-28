const NotBeginnersSection = () => {
  return (
    <section id="experience" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">001 · Опыт</span>
          <h2 className="text-foreground">
            Почему <em>даже опыт</em> <span className="mute">не спасает</span>
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
            <p className="text-base md:text-lg text-muted-foreground">
              Нет единой системы<br />
              которая держит вас в рамках
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotBeginnersSection;
