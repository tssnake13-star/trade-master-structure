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
              Вы сливаете не из-за рынка.<br />
              <span className="text-muted-foreground">Вы сливаете из-за отсутствия структуры.</span>
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed fade-in-up fade-in-up-delay-1">
              TRADE MASTER — система торговли, которая учит определять фазу рынка и входить только при совпадении контекста, структуры и реакции.
              <br />
              <span className="text-foreground/70">Без уровней, паттернов и угадываний.</span>
            </p>
            
            <div className="mt-10 fade-in-up fade-in-up-delay-2">
              <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-primary group">Пройти диагностику трейдера<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
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