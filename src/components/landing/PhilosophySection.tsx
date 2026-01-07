import logoFull from '@/assets/logo-full.png';

const PhilosophySection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        {/* Single unified container for both layouts */}
        <div className="flex flex-col md:flex-row items-start gap-3 md:gap-5 lg:gap-6">
          {/* Logo - left aligned on both mobile and desktop */}
          <img 
            src={logoFull} 
            alt="TRADELIKETYO" 
            className="w-16 h-16 md:w-[33rem] md:h-[33rem] lg:w-[39rem] lg:h-[39rem] object-contain flex-shrink-0"
          />
          
          {/* Text content */}
          <div className="flex-1">
            <h2 className="heading-section text-foreground mb-6 md:mb-8">
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
      </div>
    </section>
  );
};

export default PhilosophySection;