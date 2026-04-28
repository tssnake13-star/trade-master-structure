import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

const HeroSection = () => {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);

  return (
    <section className="relative min-h-screen w-full bg-background overflow-hidden">
      <div className="relative grid grid-cols-1 min-[900px]:grid-cols-[58%_42%] min-h-screen items-center">
        {/* LEFT — text */}
        <div className="flex items-center pt-28 pb-16 px-6 md:px-12 lg:px-20">
          <div className="w-full max-w-[760px]">
            {/* Section label */}
            <div
              className="mb-12 uppercase"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 12,
                letterSpacing: '0.18em',
              }}
            >
              <span style={{ color: 'hsl(var(--accent))' }}>01</span>
              <span style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}> · STRUCTURAL TRADING · СИСТЕМА ДОПУСКА</span>
            </div>

            {/* H1 */}
            <h1
              className="text-foreground"
              style={{
                fontFamily: "'Fraunces', 'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(56px, 7vw, 96px)',
                lineHeight: 0.95,
                fontWeight: 380,
                letterSpacing: '-0.02em',
              }}
            >
              Вы читаете <em>рынок.</em><br />
              <span className="mute">Но теряете<br />на решениях.</span>
            </h1>

            {/* Lede */}
            <p
              className="mt-8 text-foreground/85"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: 18,
                lineHeight: 1.55,
                maxWidth: '52ch',
              }}
            >
              Структура есть. Анализ есть. <strong className="font-semibold text-foreground">В момент входа всё ломается</strong> — потому что решение принимает не система, а состояние.
            </p>

            {/* CTAs */}
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <a
                href={TELEGRAM_LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              >
                Получить допуск
                <span aria-hidden>→</span>
              </a>
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-6 py-3 text-sm font-medium text-foreground/90 transition-colors hover:border-foreground/60"
              >
                Написать Сергею
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT — photo card (hidden under 900px) */}
        <div className="hidden min-[900px]:flex items-center justify-end pr-8 lg:pr-12 py-10">
          <div className="relative w-full h-[78vh] max-h-[820px] overflow-hidden rounded-sm">
            <img
              src={heroAuthor}
              alt="Сергей Тё — автор системы TRADELIKETYO"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0.35) contrast(0.9)' }}
            />
            {/* Heavy dark veil — silhouette barely visible */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, hsl(var(--background) / 0.98) 0%, hsl(var(--background) / 0.92) 40%, hsl(var(--background) / 0.85) 75%, hsl(var(--background) / 0.78) 100%)',
              }}
            />
            {/* Warm glow top-left for depth (как на референсе) */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50"
              style={{
                background:
                  'radial-gradient(circle at 30% 25%, hsl(36 40% 40% / 0.7), transparent 60%)',
              }}
            />
            {/* Left edge fade into text column */}
            <div
              className="absolute inset-y-0 left-0 pointer-events-none"
              style={{
                width: 120,
                background: 'linear-gradient(to right, hsl(var(--background)), transparent)',
              }}
            />

            {/* Bottom-left meta */}
            <span
              className="absolute bottom-5 left-5 uppercase pointer-events-none"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                color: 'hsl(var(--foreground))',
                opacity: 0.4,
              }}
            >
              Портрет автора
            </span>

            {/* Bottom-right meta */}
            <span
              className="absolute bottom-5 right-5 uppercase pointer-events-none"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                color: 'hsl(var(--foreground))',
                opacity: 0.4,
              }}
            >
              SRG_TYO · 2026
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
