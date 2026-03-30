import { TELEGRAM_LINKS } from '@/lib/constants';

const AuthorSection = () => {
  return (
    <section id="author" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground mb-8">
            Кто за этим стоит
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden bg-secondary">
                <img 
                  alt="Сергей Тё" 
                  className="w-full h-full object-cover" 
                  src="/lovable-uploads/b039968f-d8a6-42e3-9c62-6ee1e7af3057.jpg" 
                />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-1">
                Сергей Тё
              </h3>
              
              <p className="text-sm text-muted-foreground mb-5">
                Архитектор торговых систем.
              </p>
              
              <div className="space-y-4 mb-6">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Я не учу искать входы
                </p>
                <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
                  Я выстраиваю систему<br />
                  которая принимает решение
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Это другой уровень работы
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Где вы перестаёте действовать на ощущениях
                </p>
              </div>
              
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Написать Сергею Тё
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorSection;
