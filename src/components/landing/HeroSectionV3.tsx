import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import StructureField from '@/components/landing/StructureField';

/**
 * HeroSectionV3 — production landing hero in the v3 "editorial terminal" style.
 * ORIGINAL copy is preserved verbatim; only the presentation is new:
 * Cormorant headline (word-rise), moving gold candle field, author photo flush
 * to the right edge, HUD corner code + live GBP/JPY ticker, sharp CTAs.
 * No reticle. Scoped under .v3h / .v3-skin so the cabinet is untouched.
 */

// Original headline, split for the per-word rise.
const HEAD: { t: string; cls?: 'em' | 'mute' }[] = [
  { t: 'Вы' }, { t: 'читаете' }, { t: 'рынок.', cls: 'em' },
  { t: 'Но', cls: 'mute' }, { t: 'теряете', cls: 'mute' }, { t: 'из-за', cls: 'mute' }, { t: 'эмоций.', cls: 'mute' },
];

// Original positioning offer.
const OFFER: { t: string; cls?: 'gold' | 'mute' | 'uline' }[] = [
  { t: 'Помогаю опытным трейдерам перейти от ' },
  { t: 'хаотичных входов', cls: 'mute' },
  { t: ' к системе, где каждую сделку разрешает ' },
  { t: 'алгоритм', cls: 'gold' },
  { t: ', а не ' },
  { t: 'настроение в моменте', cls: 'uline' },
  { t: '.' },
];

export default function HeroSectionV3() {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);

  return (
    <section id="hero" className="v3h relative min-h-[100svh] flex flex-col justify-start lg:justify-center pt-16 md:pt-20 pb-12 md:pb-16">
      {/* abstract market-structure field (nodes + levels) */}
      <StructureField />

      {/* author photo flush to the right edge (desktop ≥lg only) */}
      <div className="v3h-photo absolute top-0 right-0 h-full w-[52%] hidden lg:block" style={{ zIndex: 1 }}>
        <img src={heroAuthor} alt="Сергей — автор системы TRADELIKETYO" />
      </div>

      {/* HUD corner code (hidden below lg to avoid the header logo) */}
      <div className="v3h-hud absolute hidden lg:block" style={{ top: 22, left: 22, zIndex: 3, lineHeight: 1.5 }}>
        8V8<br />01
      </div>

      {/* stacked centered photo for mobile + tablet (desktop ≥lg uses flush-right) */}
      <div className="lg:hidden relative w-full mb-6" style={{ height: '44vh', zIndex: 1 }}>
        <img
          src={heroAuthor}
          alt="Сергей — автор системы TRADELIKETYO"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 16%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 32%, var(--v3-bg) 96%)' }} />
      </div>

      {/* text */}
      <div className="container-landing relative" style={{ zIndex: 2 }}>
        <div className="w-full lg:max-w-[56%]">
          <div className="v3h-eyebrow v3h-mono mb-7">
            <span className="dot" /> TLT · Structural trading · Admission system
          </div>

          <h1 className="v3h-h1">
            {HEAD.map((w, i) => (
              <span key={i}>
                <span className={`word ${w.cls === 'mute' ? 'mute' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  {w.cls === 'em' ? <em>{w.t}</em> : w.t}
                </span>{' '}
              </span>
            ))}
          </h1>

          <p className="v3h-offer mt-8">
            {OFFER.map((s, i) => (
              <span key={i} className={s.cls}>{s.t}</span>
            ))}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="v3h-btn v3h-btn--solid">
              Получить систему допуска <ArrowRight className="arr w-4 h-4" />
            </a>
            <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="v3h-btn v3h-btn--ghost">
              <MessageCircle className="w-4 h-4" /> Написать Сергею
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
