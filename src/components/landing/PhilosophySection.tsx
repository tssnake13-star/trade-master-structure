import logoFull from '@/assets/logo-full.png';

const PhilosophySection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-5xl">
          {/* Mobile: Logo centered above content */}
          <div className="flex flex-col items-center mb-8 md:hidden">
            <img 
              src={logoFull} 
              alt="TRADELIKETYO" 
              className="w-[30rem] h-[30rem] object-contain"
            />
          </div>
          
          <div className="flex flex-row gap-10 md:gap-14 items-start">
            {/* Logo - left on desktop, aligned to top */}
            <div className="hidden md:flex flex-shrink-0">
              <img 
                src={logoFull} 
                alt="TRADELIKETYO" 
                className="w-[33rem] h-[33rem] lg:w-[39rem] lg:h-[39rem] object-contain"
              />
            </div>
            
            {/* Text content - right on desktop */}
            <div className="flex-1">
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
      </div>
    </section>
  );
};

export default PhilosophySection;