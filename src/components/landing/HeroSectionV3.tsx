import { useEffect, useRef } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import CandleField from '@/components/preview-next/CandleField';
import { useFxPrice } from '@/components/preview-next/useFxPrice';

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
  { t: 'Но', cls: 'mute' }, { t: 'теряете', cls: 'mute' }, { t: 'на', cls: 'mute' }, { t: 'решениях.', cls: 'mute' },
];

// Original positioning offer.
const OFFER: { t: string; cls?: 'gold' | 'mute' | 'uline' }[] = [
  { t: 'Помогаю трейдерам заменить ' },
  { t: 'хаос в решениях', cls: 'mute' },
  { t: ' на ' },
  { t: 'чёткий алгоритм', cls: 'gold' },
  { t: ' — чтобы вход разрешала ' },
  { t: 'система, а не эмоция', cls: 'uline' },
  { t: '.' },
];

export default function HeroSectionV3() {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);
  const rootRef = useRef<HTMLElement>(null);
  const { price, dir, changePct } = useFxPrice();
  const priceStr = price.toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const up = dir === 1;

  // custom cursor dot, scoped to the hero
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current, dot = cursorRef.current;
    if (!root || !dot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      dot.style.opacity = '1';
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    const leave = () => { dot.style.opacity = '0'; };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    return () => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave); };
  }, []);

  return (
    <section ref={rootRef} id="hero" className="v3h relative min-h-[100svh] flex flex-col justify-center pt-16 md:pt-20 pb-12 md:pb-16">
      <div
        ref={cursorRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 95, width: 12, height: 12,
          borderRadius: '50%', background: 'var(--v3-gold)', pointerEvents: 'none',
          mixBlendMode: 'difference', transform: 'translate(-50%, -50%)', opacity: 0,
        }}
      />

      {/* moving gold candle field */}
      <CandleField />

      {/* author photo flush to the right edge */}
      <div className="v3h-photo absolute top-0 right-0 h-full w-[52%] hidden md:block" style={{ zIndex: 1 }}>
        <img src={heroAuthor} alt="Сергей — автор системы TRADELIKETYO" />
      </div>

      {/* HUD corner code (hidden below lg to avoid the header logo) */}
      <div className="v3h-hud absolute hidden lg:block" style={{ top: 22, left: 22, zIndex: 3, lineHeight: 1.5 }}>
        8V8<br />01
      </div>

      {/* HUD live ticker */}
      <div className="v3h-ticker-wrap text-right">
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="v3h-ticker__price">{priceStr}</span>{' '}
          <span className="v3h-mono" style={{ fontSize: 12, color: up ? 'oklch(0.72 0.16 150)' : 'oklch(0.62 0.17 25)' }}>
            {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
          </span>
        </div>
        <div className="v3h-mono" style={{ fontSize: 9, marginTop: 4 }}>GBP / JPY · H4</div>
        <div className="v3h-live v3h-mono" style={{ fontSize: 9, marginTop: 8 }}>
          <span className="dot" />LIVE FEED · ECHO GATE — ON
        </div>
      </div>

      {/* mobile photo — stacked above the text (desktop uses the flush-right one) */}
      <div className="md:hidden relative w-full mb-7" style={{ height: '40vh', zIndex: 1 }}>
        <img
          src={heroAuthor}
          alt="Сергей — автор системы TRADELIKETYO"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 8%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 32%, var(--v3-bg) 96%)' }} />
      </div>

      {/* text */}
      <div className="container-landing relative" style={{ zIndex: 2 }}>
        <div className="w-full md:max-w-[56%]">
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
