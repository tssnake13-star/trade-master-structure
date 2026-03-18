const DecisionProcessSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Без жёстких правил рынок сильнее вас
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Рынок не прощает решений "на глаз"
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Если нет фильтра<br />
              вы будете действовать хаотично
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Даже если иногда будете попадать
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Система нужна не чтобы зарабатывать<br /><br />
              А чтобы не терять там<br />
              где нельзя работать
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DecisionProcessSection;
