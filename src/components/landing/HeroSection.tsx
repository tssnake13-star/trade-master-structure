import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center pt-20 pb-16 md:pb-24">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h1 className="heading-hero text-foreground fade-in-up">
            Вы не сливаете из-за рынка.
            <br />
            <span className="text-muted-foreground">Вы сливаете из-за отсутствия структуры.</span>
          </h1>
          
          <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl fade-in-up fade-in-up-delay-1">
            TRADE MASTER — система торговли, которая учит определять фазу рынка и входить только при совпадении контекста, структуры и реакции.
            <br />
            <span className="text-foreground/70">Без уровней, паттернов и угадываний.</span>
          </p>
          
          <div className="mt-10 fade-in-up fade-in-up-delay-2">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              Получить первый разбор в Telegram
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
