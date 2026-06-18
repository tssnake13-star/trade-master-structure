import { useEffect, useRef } from 'react';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import { TELEGRAM_LINKS } from '@/lib/constants';
import CandleField from './CandleField';
import { useFxPrice } from './useFxPrice';

/**
 * HeroV3 — faithful rebuild of the shared "TRADELIKETYO Redesign v3" hero.
 * Editorial terminal: giant Cormorant headline (roman → italic → roman) over a
 * faint gold candle field, author photo flush to the right edge with a rotating
 * targeting reticle, ghost section number, HUD corner codes + live ticker, and
 * a custom mix-blend cursor dot. Self-contained, scoped under .pn-v3.
 */
const HEAD_WORDS: { t: string; em?: boolean }[] = [
  { t: 'Анализ' }, { t: '—' }, { t: 'это', em: true }, { t: 'не' }, { t: 'решение.' },
];

export default function HeroV3() {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);
  const rootRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { price, dir, changePct } = useFxPrice();
  const priceStr = price.toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const up = dir === 1;

  // custom cursor dot, scoped to the hero
  useEffect(() => {
    const root = rootRef.current;
    const dot = cursorRef.current;
    if (!root || !dot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      dot.style.opacity = '1';
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    const leave = () => { dot.style.opacity = '0'; };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <section ref={rootRef} id="hero" className="pn-v3 relative min-h-[100svh] flex items-center">
      <div ref={cursorRef} className="pn-v3-cursor" style={{ opacity: 0 }} />

      {/* faint candle texture behind everything */}
      <CandleField />

      {/* author photo flush to the right edge */}
      <div className="v3-photo absolute top-0 right-0 h-full w-[52%] hidden md:block" style={{ zIndex: 1 }}>
        <img src={heroAuthor} alt="Сергей — автор системы TRADELIKETYO" />
      </div>

      {/* HUD: corner code + vertical label + live ticker */}
      <div className="v3-hud absolute" style={{ top: 24, left: 24, zIndex: 3, lineHeight: 1.5 }}>
        8V8<br />01
      </div>
      <div className="absolute text-right" style={{ top: 24, right: 28, zIndex: 3 }}>
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="v3-ticker__price">{priceStr}</span>{' '}
          <span
            className="v3-mono"
            style={{ fontSize: 12, color: up ? 'oklch(0.72 0.16 150)' : 'oklch(0.62 0.17 25)' }}
          >
            {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
          </span>
        </div>
        <div className="v3-mono" style={{ fontSize: 9, marginTop: 4 }}>GBP / JPY · H4</div>
        <div className="v3-live v3-mono" style={{ fontSize: 9, marginTop: 8 }}>
          <span className="dot" />LIVE FEED · ECHO GATE — ON
        </div>
      </div>

      {/* text content */}
      <div className="container-landing relative" style={{ zIndex: 2 }}>
        <div className="max-w-[60%] md:max-w-[56%]">
          <div className="v3-eyebrow v3-mono mb-7">
            <span className="dot" /> Структурный анализ · с 2011
          </div>

          <h1 className="v3-h1">
            {HEAD_WORDS.map((w, i) => (
              <span key={i}>
                <span
                  className="word"
                  style={{ animationDelay: `${i * 0.09}s` }}
                >
                  {w.em ? <em>{w.t}</em> : w.t}
                </span>{' '}
              </span>
            ))}
          </h1>

          <p className="v3-lede mt-8">
            Вы видите структуру. Понимаете направление. Но в момент входа всё ломается —
            потому что решение принимает <b>состояние</b>, а не система.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="v3-btn v3-btn--solid">
              Получить систему <span className="arr">→</span>
            </a>
            <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="v3-btn v3-btn--ghost">
              Написать Сергею
            </a>

            {/* ECHO GATE R:R crosshair tag */}
            <div className="v3-mono hidden lg:flex items-center gap-3" style={{ marginLeft: 12, fontSize: 10 }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.6 }}>
                <path d="M1 5V1h4M21 5V1h-4M1 17v4h4M21 17v4h-4" />
                <circle cx="11" cy="11" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              <span>ECHO GATE<br />R:R 10:1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
