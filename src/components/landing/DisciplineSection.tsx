const DisciplineSection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="heading-section text-foreground">
            Почему без жёстких правил трейдинг не работает
          </h2>
          
          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              В трейдинге не работают мягкие правила.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Работают только те, которые нельзя нарушать.
            </p>
          </div>
          
          <div className="mt-6 md:mt-8 p-4 md:p-5 bg-accent/30 rounded-lg border-l-2 border-foreground/30">
            <p className="text-foreground font-medium">
              Здесь нет свободы интерпретаций.<br />
              Есть сценарии, точки отмены и ответственность за решение.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DisciplineSection;
