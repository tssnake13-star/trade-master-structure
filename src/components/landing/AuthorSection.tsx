import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import logoFull from '@/assets/logo-full.png';

const AuthorSection = () => {
  return (
    <section id="author" className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          {/* Logo */}
          <div className="mb-10 md:mb-14">
            <img 
              src={logoFull} 
              alt="TRADELIKETYO - Institute of Trading Logic" 
              className="h-24 md:h-32 w-auto object-contain"
            />
          </div>
          
          <h2 className="heading-section text-foreground mb-12">
            Автор
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            <div className="flex-shrink-0">
              <div className="w-56 h-56 md:w-64 md:h-64 rounded-xl overflow-hidden bg-secondary">
                <img 
                  alt="Сергей Тё — автор системы TRADE MASTER" 
                  className="w-full h-full object-cover" 
                  src="/lovable-uploads/b039968f-d8a6-42e3-9c62-6ee1e7af3057.jpg" 
                />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-foreground mb-6">
                Сергей Тё
              </h3>
              
              <div className="space-y-3 mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  12+ лет на рынке. Работаю с реальными деньгами, а не с теорией.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Моя задача — убрать хаос в Вашей голове и дать рабочий алгоритм.
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground/70 mb-6">
                TRADE MASTER — результат личной практики.
              </p>
              
              {/* CTA ведёт в бота, не в личку */}
              <a 
                href={TELEGRAM_LINKS.bot} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary group"
              >
                Получить алгоритм
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="mt-3 text-xs text-muted-foreground">
                Бесплатный разбор Вашей стратегии
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorSection;