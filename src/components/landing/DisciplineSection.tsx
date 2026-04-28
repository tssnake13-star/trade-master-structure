const DisciplineSection = () => {
  return (
    <section className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Правила</span>
          <h2 className="text-foreground">
            Без <em>жёстких правил</em> <span className="mute">рынок сильнее вас</span>
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

export default DisciplineSection;
