const steps = ['Хаос', 'Фаза', 'Подтверждение', 'Зона', 'Решение'];

const StructureDiagram = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          {/* Diagram */}
          <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="px-4 py-2 md:px-5 md:py-2.5 border border-border rounded-full">
                  <span className="text-sm md:text-base text-muted-foreground">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <span className="mx-2 md:mx-3 text-muted-foreground/50">→</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Caption */}
          <p className="mt-8 text-sm text-muted-foreground/70 text-center">
            Сначала структура. Потом вход.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StructureDiagram;
