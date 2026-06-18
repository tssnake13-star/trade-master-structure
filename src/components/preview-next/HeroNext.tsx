import { useRef } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import Magnetic from '@/components/Magnetic';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import { KineticHeadline, CountUp } from './primitives';
import DecodeHeadline from './DecodeHeadline';

export type WowVariant = 'decode' | 'halo' | 'v3';

/**
 * HeroNext — "wow" hero for /preview-next (no chart, no torchlight).
 *
 * Shared base: 3D-tilting author photo + gold sheen + floating glass stat
 * chips that count up. Two switchable WOW variants for the headline scene:
 *   - 'decode' — headline assembles out of scrambling glyphs.
 *   - 'halo'   — masked word-reveal headline + a soft floating aura behind
 *                the photo, with the luminous flowing-gradient accents.
 * The big "thought" wordmark dividers between sections are kept untouched.
 */
export default function HeroNext({ variant = 'decode' }: { variant?: WowVariant }) {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);
  const photoRef = useRef<HTMLDivElement>(null);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 3D tilt only — torchlight removed.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const photo = photoRef.current;
    if (!photo) return;
    const r = photo.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    photo.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
    photo.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
  };
  const onLeave = () => {
    const photo = photoRef.current;
    if (photo) {
      photo.style.setProperty('--ry', '0deg');
      photo.style.setProperty('--rx', '0deg');
    }
  };

  return (
    <section id="hero" className="relative pt-24 pb-12 md:pb-20">
      <div className="pn-stage container-landing relative" style={{ zIndex: 2 }}>
        <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          {/* Text */}
          <div className="w-full lg:basis-[46%] lg:max-w-[46%] order-2 lg:order-1">
            <div className="section-label mb-5 pn-rise is-in">
              TLT · STRUCTURAL TRADING · ADMISSION SYSTEM
            </div>

            {variant === 'decode' ? (
              <DecodeHeadline
                className="leading-[0.98] text-foreground"
                lines={[
                  [{ text: 'Вы читаете ' }, { text: 'рынок.', cls: 'pn-gold' }],
                  [{ text: 'Но теряете на решениях.', cls: 'mute' }],
                ]}
              />
            ) : (
              <KineticHeadline
                as="h1"
                className="leading-[0.98] text-foreground"
                lines={[
                  ['Вы читаете ', { text: 'рынок.', gold: true, flow: true }],
                  [{ text: 'Но теряете на решениях.', mute: true }],
                ]}
              />
            )}

            <KineticHeadline
              as="p"
              className="offer-line mt-7 text-lg md:text-xl lg:text-[1.55rem] text-foreground/90"
              style={{ maxWidth: '44ch' }}
              lines={[
                [
                  { text: 'Заменяем ' },
                  { text: 'хаос в решениях', mute: true },
                  { text: ' на ' },
                  { text: 'чёткий алгоритм', gold: true, flow: variant === 'halo' },
                  { text: ' — вход разрешает ' },
                  { text: 'система, а не эмоция', gold: true, uline: true },
                  { text: '.' },
                ],
              ]}
            />

            <div className="mt-9 flex flex-col items-start gap-3 pn-rise" style={{ ['--i' as string]: 8 }}>
              <Magnetic>
                <a
                  href={TELEGRAM_LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary group text-base md:text-lg"
                  style={{ animation: 'ctaGlow 4s ease-in-out infinite' }}
                >
                  Получить систему допуска
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Magnetic>
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Написать Сергею
              </a>
            </div>
          </div>

          {/* Author photo — 3D tilt + sheen + floating stat chips (+ halo in 'halo' variant) */}
          <div
            className="relative w-full lg:basis-[54%] lg:max-w-[54%] order-1 lg:order-2 pn-rise is-in"
            style={{ ['--i' as string]: 1 }}
          >
            {variant === 'halo' && <div className="pn-halo" aria-hidden />}

            <div
              ref={photoRef}
              className="pn-photo"
              onPointerMove={onMove}
              onPointerLeave={onLeave}
            >
              <div className="logo-shimmer relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[560px] xl:h-[640px] rounded-xl md:rounded-2xl overflow-hidden">
                <img
                  src={heroAuthor}
                  alt="Сергей — автор системы TRADELIKETYO"
                  className="w-full h-full object-cover object-[50%_15%] brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent lg:from-background/45 lg:via-transparent lg:to-transparent" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 120px hsl(var(--accent) / 0.12)' }}
                />
              </div>

              <div className="pn-chip pn-chip--a">
                <span className="pn-chip__num">
                  <CountUp to={1200} suffix="+" />
                </span>
                <span className="pn-chip__label">Учеников в системе</span>
              </div>
              <div className="pn-chip pn-chip--b">
                <span className="pn-chip__num">
                  <CountUp to={68} suffix="%" />
                </span>
                <span className="pn-chip__label">Винрейт по системе</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
