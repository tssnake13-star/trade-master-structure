import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthor from '@/assets/hero-author.jpg';
const HeroSection = () => {
  return <section className="min-h-screen flex items-center pt-20 pb-16 md:pb-24">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl">
            <h1 className="heading-hero text-foreground fade-in-up">
              Вы теряете деньги не из-за рынка.<br />
              <span className="text-muted-foreground">А из-за отсутствия чёткого торгового сценария.</span>
            </h1>
            
            <div className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed fade-in-up fade-in-up-delay-1 space-y-4">
              <p>
                Большинство трейдеров принимают решения на эмоциях, в середине движения или без понимания текущей фазы рынка.
              </p>
              <p>
                В результате — нестабильные входы, сомнения и повторяющиеся ошибки.
              </p>
              <p className="text-foreground font-medium">
                Проблема не в вас. Проблема в отсутствии структуры.
              </p>
            </div>
            
            <div className="mt-10 fade-in-up fade-in-up-delay-2">
              <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-primary group">
                Пройти диагностику трейдера
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="mt-3 text-sm text-muted-foreground">
                Бесплатно · 3 минуты · Без регистрации
              </p>
            </div>
          </div>
          
          {/* Author Photo */}
          <div className="flex-shrink-0 fade-in-up fade-in-up-delay-2">
            <div className="relative w-80 h-[28rem] md:w-[26rem] md:h-[38rem] lg:w-[32rem] lg:h-[44rem] rounded-2xl overflow-hidden">
              <img src={heroAuthor} alt="Сергей — автор системы TRADE MASTER" className="w-full h-full object-cover object-top" />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;