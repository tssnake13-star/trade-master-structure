import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

const RedesignHero = () => {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);

  return (
    <section
      id="hero"
      className="min-h-[100svh] lg:min-h-screen flex flex-col justify-between pt-16 md:pt-20 pb-6"
    >
      <div className="container-landing flex-1 flex items-center">
        <div className="w-full">
          {/* Kicker */}
          <div className="kicker reveal mb-8 md:mb-10">
            <span className="num">01</span>
            <span className="dot" />
            <span>STRUCTURAL TRADING</span>
            <span className="dot" />
            <span>СИСТЕМА ДОПУСКА</span>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-16">
            {/* Text */}
            <div className="w-full lg:basis-[45%] lg:max-w-[45%] order-2 lg:order-1">
              <h1 className="leading-[0.96] text-foreground reveal">
                Вы читаете <em>рынок.</em>
                <br />
                <span className="mute">Но теряете на решениях.</span>
              </h1>

              <p
                className="lede mt-6 md:mt-8 reveal"
                style={{ transitionDelay: '120ms' }}
              >
                Структура есть. Анализ есть. В момент входа всё ломается —
                потому что решение принимает не система, а состояние.
              </p>

              <div
                className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 reveal"
                style={{ transitionDelay: '240ms' }}
              >
                <a
                  href={TELEGRAM_LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary group text-base md:text-lg"
                >
                  Получить допуск{' '}
                  <em
                    className="ml-2 not-italic"
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontStyle: 'italic',
                      fontWeight: 400,
                    }}
                  >
                    →
                  </em>
                </a>
                <a
                  href={TELEGRAM_LINKS.dm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm text-muted-foreground font-medium rounded-lg border border-border/50 hover:text-foreground hover:border-border transition-all duration-200"
                >
                  Написать Сергею
                </a>
              </div>
            </div>

            {/* Photo */}
            <div className="w-full lg:basis-[55%] lg:max-w-[55%] order-1 lg:order-2 reveal">
              <div className="relative w-full h-56 md:h-[24rem] lg:h-[600px] xl:h-[720px] rounded-sm overflow-hidden">
                <img
                  src={heroAuthor}
                  alt="Сергей Тё — автор системы TRADELIKETYO"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="container-landing mt-8">
        <div
          className="flex items-center justify-center gap-3 md:gap-6 flex-wrap text-center"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'hsl(var(--muted-foreground) / 0.5)',
          }}
        >
          <span>Est. 2019</span>
          <span aria-hidden>─</span>
          <span>↓ Scroll</span>
          <span aria-hidden>─</span>
          <span>Forex · Crypto · Indices</span>
        </div>
      </div>
    </section>
  );
};

export default RedesignHero;