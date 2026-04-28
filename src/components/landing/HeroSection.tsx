import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

const HeroSection = () => {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);
  return (
    <section className="min-h-[100svh] lg:min-h-screen flex items-center pt-16 md:pt-20 pb-8 md:pb-16 lg:pb-24">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl order-2 lg:order-1">
            <h1 className="leading-tight text-foreground fade-in-up">
              Вы уже умеете <em>анализировать</em> рынок<br />
              <span className="mute">Но всё равно теряете на решениях</span>
            </h1>
            <div className="mt-4 md:mt-6 space-y-3 fade-in-up fade-in-up-delay-1">
              <p className="text-base md:text-lg lg:text-xl text-foreground/90 leading-snug">
                Вы не новичок
              </p>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-snug">
                Вы видите структуру<br />
                понимаете направление
              </p>
              <p className="text-base md:text-lg lg:text-xl text-foreground/90 leading-snug font-medium">
                Но в момент входа всё ломается
              </p>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground leading-snug">
                Решение принимается не системой<br />
                а состоянием
              </p>
            </div>
            
            {/* CTA */}
            <div className="mt-8 md:mt-10 flex flex-col gap-3 fade-in-up fade-in-up-delay-2">
              <a
                href={TELEGRAM_LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary group text-base md:text-lg"
              >
                Получить систему допуска
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm text-muted-foreground font-medium rounded-lg border border-border/50 hover:text-foreground hover:border-border transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Написать Сергею
              </a>
            </div>
          </div>
          
          {/* Author Photo */}
          <div className="flex-shrink-0 fade-in-up fade-in-up-delay-1 order-1 lg:order-2">
            <div className="relative w-48 h-56 md:w-72 md:h-[24rem] lg:w-[28rem] lg:h-[36rem] xl:w-[32rem] xl:h-[44rem] rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={heroAuthor}
                alt="Сергей — автор системы TRADELIKETYO"
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
