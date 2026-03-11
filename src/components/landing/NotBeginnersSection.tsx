const NotBeginnersSection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Большинство трейдеров, которые приходят ко мне, — не новички.
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Они уже прошли курсы. Изучили стратегии. Провели в рынке год, два, три. Но в момент сделки происходит одно и то же: сомнение, импульс, вход на эмоциях. А потом — или стоп, или закрытие раньше времени, потому что нервы не выдерживают. Проблема не в психологии и не в знаниях. Проблема в том, что нет системы, которая говорит «можно» или «нельзя» до того, как вы нажали кнопку.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotBeginnersSection;
