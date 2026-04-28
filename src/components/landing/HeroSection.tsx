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
          <div className="w-full lg:basis-[45%] lg:max-w-[45%] order-2 lg:order-1">
            <div className="section-label mb-4">TLT · STRUCTURAL TRADING · ADMISSION SYSTEM</div>
            <h1 className="leading-tight text-foreground fade-in-up">
              Вы читаете <em>рынок.</em> <span className="mute">Но теряете на решениях.</span>
            </h1>
            <div className="mt-4 md:mt-6 space-y-3 fade-in-up fade-in-up-delay-1">
              <p className="text-base md:text-lg lg:text-xl text-foreground/90 leading-snug">
                Структура есть. Анализ есть. <strong className="font-bold">В момент входа всё ломается</strong> — потому что решение принимает не система, а состояние.
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
          <div className="w-full lg:basis-[55%] lg:max-w-[55%] fade-in-up fade-in-up-delay-1 order-1 lg:order-2">
            <div className="relative w-full h-56 md:h-[24rem] lg:h-[600px] xl:h-[720px] rounded-xl md:rounded-2xl overflow-hidden">
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
