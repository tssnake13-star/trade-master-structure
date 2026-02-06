import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthor from '@/assets/hero-author.jpg';

const HeroSection = () => {
  return (
    <section className="min-h-[100svh] lg:min-h-screen flex items-center pt-16 md:pt-20 pb-8 md:pb-16 lg:pb-24">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl order-2 lg:order-1">
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-foreground fade-in-up">
              TRADE MASTER 4.5 — операционная система трейдинга
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-muted-foreground leading-snug fade-in-up fade-in-up-delay-1">
              Если вы торгуете в хаосе и платите за это деньгами — проблема не в рынке.
            </p>
            
            {/* CTA - 2 buttons only */}
            <div className="mt-8 md:mt-10 flex flex-col gap-3 fade-in-up fade-in-up-delay-2">
              <a
                href={TELEGRAM_LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary group text-base md:text-lg"
              >
                Встроить алгоритм
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3.5 bg-secondary text-foreground text-sm md:text-base font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Написать Сергею Тё
              </a>
            </div>
          </div>
          
          {/* Author Photo */}
          <div className="flex-shrink-0 fade-in-up fade-in-up-delay-1 order-1 lg:order-2">
            <div className="relative w-48 h-56 md:w-72 md:h-[24rem] lg:w-[28rem] lg:h-[36rem] xl:w-[32rem] xl:h-[44rem] rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={heroAuthor}
                alt="Сергей — автор системы TRADE MASTER"
                className="w-full h-full object-cover object-top brightness-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-background/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
