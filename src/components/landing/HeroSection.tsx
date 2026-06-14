import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import Magnetic from '@/components/Magnetic';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

// Positioning offer with word-by-word cascade + drawn underline on the key phrase
const OFFER_SEGMENTS: { text: string; cls?: string }[] = [
  { text: 'Помогаю трейдерам заменить ' },
  { text: 'хаос в решениях', cls: 'mute' },
  { text: ' на ' },
  { text: 'чёткий алгоритм', cls: 'gold' },
  { text: ' — чтобы вход разрешала ' },
  { text: 'система, а не эмоция', cls: 'gold uline' },
  { text: '.' },
];

const OfferLine = () => {
  let wordIndex = 0;
  return (
    <p className="offer-line mt-6 md:mt-7 text-xl md:text-2xl lg:text-[1.8rem] text-foreground/90">
      {OFFER_SEGMENTS.map((seg, si) => {
        const parts = seg.text.split(/(\s+)/);
        return (
          <span key={si} className={seg.cls}>
            {parts.map((part, j) => {
              if (part.trim() === '') return <span key={j}>{part}</span>;
              const delay = (wordIndex++ * 0.06).toFixed(2);
              return (
                <span key={j} className="ow" style={{ animationDelay: `${delay}s` }}>{part}</span>
              );
            })}
          </span>
        );
      })}
    </p>
  );
};

const HeroSection = () => {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);
  return (
    <section id="hero" className="min-h-[100svh] lg:min-h-screen flex items-center pt-16 md:pt-20 pb-8 md:pb-16 lg:pb-24">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="w-full lg:basis-[45%] lg:max-w-[45%] order-2 lg:order-1">
            <div className="section-label mb-4">TLT · STRUCTURAL TRADING · ADMISSION SYSTEM</div>
            <h1 className="leading-tight text-foreground fade-in-up">
              Вы читаете <em>рынок.</em> <span className="mute">Но теряете на решениях.</span>
            </h1>
            <OfferLine />

            {/* CTA */}
            <div className="mt-8 md:mt-10 flex flex-col items-start gap-3 fade-in-up fade-in-up-delay-2">
              <Magnetic>
                <a
                  href={TELEGRAM_LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary group text-base md:text-lg"
                >
                  Получить систему допуска
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Magnetic>
              
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Написать Сергею
              </a>
            </div>
          </div>
          
          {/* Author Photo */}
          <div className="w-full lg:basis-[55%] lg:max-w-[55%] fade-in-up fade-in-up-delay-1 order-1 lg:order-2">
            <div className="relative w-full h-[420px] sm:h-[520px] md:h-[640px] lg:h-[600px] xl:h-[720px] rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={heroAuthor}
                alt="Сергей — автор системы TRADELIKETYO"
                className="w-full h-full object-cover object-[50%_15%] brightness-[0.85]"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent lg:from-background/70 lg:via-background/20 lg:to-background/10 lg:inset-0 lg:h-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
