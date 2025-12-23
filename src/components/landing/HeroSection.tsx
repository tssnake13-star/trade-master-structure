import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthor from '@/assets/hero-author.jpg';
const HeroSection = () => {
  return <section className="min-h-[100svh] lg:min-h-screen flex items-center pt-16 md:pt-20 pb-8 md:pb-16 lg:pb-24">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl order-2 lg:order-1">
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-foreground fade-in-up">
              Вы теряете деньги не из-за рынка.
              <span className="block mt-1 md:mt-2 text-muted-foreground">Из-за отсутствия чёткого торгового сценария.</span>
            </h1>
            
            {/* Subheadline - hidden on mobile for compactness */}
            <div className="hidden md:block mt-6 lg:mt-8 text-lg md:text-xl leading-relaxed fade-in-up fade-in-up-delay-1 space-y-4 lg:space-y-6">
              <p className="text-muted-foreground">
                Большинство трейдеров принимают решения на эмоциях, в середине движения или без понимания текущей фазы рынка.
              </p>
              <p className="text-muted-foreground/70">
                В результате – нестабильные входы, сомнения и повторяющиеся ошибки.
              </p>
            </div>
            
            {/* Accent phrase - compact on mobile */}
            <p className="mt-4 md:mt-8 lg:mt-10 text-base md:text-lg lg:text-xl text-foreground/90 font-medium fade-in-up fade-in-up-delay-1">
              Проблема не в вас. Проблема в отсутствии структуры.
            </p>
            
            {/* CTA with reduced spacing on mobile */}
            <div className="mt-6 md:mt-10 lg:mt-14 fade-in-up fade-in-up-delay-2">
              <p className="hidden md:block mb-3 text-sm text-muted-foreground/70">
                Алгоритм работает только при понимании контекста – поэтому сначала короткий разбор.
              </p>
              <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-primary group text-base md:text-lg">
                Получить торговый алгоритм
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                7 вопросов → разбор логики → алгоритм
              </p>
            </div>
          </div>
          
          {/* Author Photo - smaller on mobile, shown first */}
          <div className="flex-shrink-0 fade-in-up fade-in-up-delay-1 order-1 lg:order-2">
            <div className="relative w-48 h-56 md:w-72 md:h-[24rem] lg:w-[28rem] lg:h-[36rem] xl:w-[32rem] xl:h-[44rem] rounded-xl md:rounded-2xl overflow-hidden">
              <img src={heroAuthor} alt="Сергей — автор системы TRADE MASTER" className="w-full h-full object-cover object-top brightness-[0.85]" />
              {/* Gradient overlay for visual balance with text */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-background/10" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;