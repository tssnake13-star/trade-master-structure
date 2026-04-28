const WhyCoursesFailSection = () => {
  return (
    <section id="learning" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">02 · Обучение</span>
          <h2 className="text-foreground">
            Почему <em>обучение</em> <span className="mute">не даёт результат</span>
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Вы проходили курсы<br />
              изучали стратегии<br />
              смотрели разборы
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Но в момент сделки остаётесь один на один с рынком
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Никто не даёт вам чёткий ответ<br />
              можно входить или нет
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              Всё заканчивается интерпретацией
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              А интерпретация — это всегда ошибка
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyCoursesFailSection;
