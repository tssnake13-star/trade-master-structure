import logoFull from '@/assets/logo-full.png';

const PhilosophySection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="flex justify-start mb-4">
            <img 
              src={logoFull} 
              alt="TRADELIKETYO" 
              className="w-[30rem] h-[30rem] object-contain -ml-8"
            />
          </div>
          <h2 className="heading-section text-foreground mb-6">
            Философия
          </h2>
          <div className="space-y-6">
            <p className="text-xl text-foreground leading-relaxed">
              Решение принимается по сценарию. Есть условия — есть вход. Нет условий — осознанный пропуск.
            </p>
            <div className="divider my-6" />
            <p className="text-lg text-muted-foreground">
              <span className="text-foreground font-medium">TRADE MASTER</span> — это не сигналы. Это правила, условия и дисциплина.
            </p>
          </div>
        </div>

        {/* Desktop layout - tight composition */}
        <div className="hidden md:flex items-start gap-6 lg:gap-8">
          <img 
            src={logoFull} 
            alt="TRADELIKETYO" 
            className="w-[33rem] h-[33rem] lg:w-[39rem] lg:h-[39rem] object-contain flex-shrink-0 -mt-4"
          />
          <div className="flex-1 pt-2">
            <h2 className="heading-section text-foreground mb-8">
              Философия
            </h2>
            <div className="space-y-6">
              <p className="text-xl text-foreground leading-relaxed">
                Решение принимается по сценарию. Есть условия — есть вход. Нет условий — осознанный пропуск.
              </p>
              <div className="divider my-8" />
              <p className="text-lg text-muted-foreground">
                <span className="text-foreground font-medium">TRADE MASTER</span> — это не сигналы. Это правила, условия и дисциплина.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;