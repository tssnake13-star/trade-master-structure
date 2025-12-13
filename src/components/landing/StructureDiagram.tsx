const steps = ['Хаос', 'Фаза', 'Подтверждение', 'Зона', 'Решение'];

const StructureDiagram = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Diagram - horizontal */}
          <div className="hidden md:flex items-center justify-center gap-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="px-5 py-2.5 border border-border rounded-full">
                  <span className="text-base text-muted-foreground">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <span className="mx-3 text-muted-foreground/50">→</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile Diagram - vertical */}
          <div className="flex md:hidden flex-col items-center gap-3">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="px-6 py-3 border border-border rounded-full">
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <span className="my-2 text-muted-foreground/50">↓</span>
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
