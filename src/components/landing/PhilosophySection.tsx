const PhilosophySection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground mb-8">
            Философия
          </h2>
          <div className="space-y-6">
            <p className="text-xl text-foreground leading-relaxed">
              Решение принимается по сценарию. Есть условия — есть вход. Нет условий — осознанный пропуск.
            </p>
            <div className="divider my-6 md:my-8" />
            <p className="text-lg text-muted-foreground">
              <span className="text-foreground font-medium">TRADE MASTER</span> — это не сигналы. Это правила, условия и дисциплина.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;