import logoFull from '@/assets/logo-full.png';

const PhilosophySection = () => {
  return (
    <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground mb-10">
            Философия
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            {/* Logo - left on desktop, top on mobile */}
            <div className="flex-shrink-0 flex justify-center">
              <img 
                src={logoFull} 
                alt="TRADELIKETYO" 
                className="w-48 h-48 md:w-56 md:h-56 object-contain"
              />
            </div>
            
            {/* Text content - right on desktop, below on mobile */}
            <div className="flex-1">
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