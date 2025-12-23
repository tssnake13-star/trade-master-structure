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
              Вы теряете деньги не из-за рынка.
              <span className="block mt-2 text-muted-foreground">Из-за отсутствия чёткого торгового сценария.</span>
            </h1>
            
            {/* Subheadline - two separate paragraphs */}
            <div className="mt-8 text-lg md:text-xl leading-relaxed fade-in-up fade-in-up-delay-1 space-y-6">
              <p className="text-muted-foreground">
                Большинство трейдеров принимают решения на эмоциях, в середине движения или без понимания текущей фазы рынка.
              </p>
              <p className="text-muted-foreground/70">
                В результате — нестабильные входы, сомнения и повторяющиеся ошибки.
              </p>
            </div>
            
            {/* Accent phrase - key emotional point */}
            <p className="mt-10 text-lg md:text-xl text-foreground/90 font-medium fade-in-up fade-in-up-delay-1">
              Проблема не в вас. Проблема в отсутствии структуры.
            </p>
            
            {/* CTA with increased spacing */}
            <div className="mt-14 fade-in-up fade-in-up-delay-2">
              <p className="mb-3 text-sm text-muted-foreground/70">
                Алгоритм работает только при понимании контекста — поэтому сначала короткий разбор.
              </p>
              <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-primary group">
                Получить торговый алгоритм
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="mt-3 text-sm text-muted-foreground">
                7 коротких вопросов → разбор вашей торговой логики → мой рабочий алгоритм
              </p>
            </div>
          </div>
          
          {/* Author Photo */}
          <div className="flex-shrink-0 fade-in-up fade-in-up-delay-2">
            <div className="relative w-80 h-[28rem] md:w-[26rem] md:h-[38rem] lg:w-[32rem] lg:h-[44rem] rounded-2xl overflow-hidden">
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