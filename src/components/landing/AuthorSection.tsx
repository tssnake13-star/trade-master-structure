import { ArrowRight, Send } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const AuthorSection = () => {
  return (
    <section id="author" className="py-20 md:py-28">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground mb-12">
            Автор
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            <div className="flex-shrink-0">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden bg-secondary">
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
              
              <div className="space-y-4 mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  Трейдер с более чем 12-летним опытом работы на финансовых рынках.
                  <br />
                  Практикующий, а не теоретик.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Работаю с рыночной структурой: фазы, накопления, выходы, тесты, контекст.
                  <br />
                  Без уровней, паттернов и угадываний.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Моя задача — вырастить самостоятельного трейдера с мышлением и алгоритмом,
                  <br />
                  а не зависимого от сигналов ученика.
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground/70 mb-8">
                TRADE MASTER — результат личной практики и многолетних наблюдений за рынком.
              </p>
              
              <a 
                href={TELEGRAM_LINKS.dm} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-secondary group"
              >
                <Send className="w-4 h-4 mr-2" />
                Написать в Telegram
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorSection;