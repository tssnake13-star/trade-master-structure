import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

const HeroSection = () => {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);
  return (
    <section className="hero">
      <div className="hero-text">
        <div
          className="fade-in-up mb-6"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'hsl(var(--muted-foreground) / 0.7)',
          }}
        >
          01 · STRUCTURAL TRADING · СИСТЕМА ДОПУСКА
        </div>

        <h1 className="leading-tight text-foreground fade-in-up">
          Вы читаете <em>рынок.</em>
          <br />
          <span className="mute">Но теряете на решениях.</span>
        </h1>

        <p className="mt-6 text-base md:text-lg lg:text-xl text-muted-foreground leading-snug fade-in-up fade-in-up-delay-1 max-w-xl">
          Структура есть. Анализ есть.
          <br />
          В момент входа всё ломается —<br />
          потому что решение принимает не система, а состояние.
        </p>

        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 fade-in-up fade-in-up-delay-2">
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

      <div className="hero-photo">
        <img src={heroAuthor} alt="Сергей — автор системы TRADELIKETYO" />
        <div className="hero-photo-label-left">Портрет автора</div>
        <div className="hero-photo-label-right">SRG_TYO · 2026</div>
      </div>
    </section>
  );
};

export default HeroSection;
