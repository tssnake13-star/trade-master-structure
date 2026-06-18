import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/preview-next.css';

import AuroraField from '@/components/preview-next/AuroraField';
import InstrumentTicker from '@/components/landing/InstrumentTicker';

import HeroNext, { type WowVariant } from '@/components/preview-next/HeroNext';
import HeroV3 from '@/components/preview-next/HeroV3';
import StatsNext from '@/components/preview-next/StatsNext';
import PillarsNext from '@/components/preview-next/PillarsNext';
import WordmarkKinetic from '@/components/preview-next/WordmarkKinetic';
import FinalCTANext from '@/components/preview-next/FinalCTANext';

/**
 * /preview-next
 *
 * Animation sandbox that mixes the three explored directions:
 *   A — market motion (drawing candlesticks, count-up numbers)
 *   B — kinetic editorial type (masked word reveals, kinetic wordmark)
 *   C — aurora light + cursor-spotlight cards
 *
 * Self-contained: reuses only ConstellationBg + InstrumentTicker from the
 * production landing. The live site at "/" is untouched.
 */
export default function PreviewNext() {
  const railRef = useRef<HTMLDivElement>(null);
  const [wow, setWow] = useState<WowVariant>('v3');

  // Top scroll-progress rail.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        rail.style.setProperty('--pn-progress', String(p));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div data-pn className="min-h-screen bg-background text-foreground landing-skin relative">
      <div ref={railRef} className="pn-scrollbar" />
      {wow !== 'v3' && <AuroraField />}

      <div className="pn-banner">
        <span>Preview · Next · WOW</span>
        <div className="flex items-center gap-2">
          {([
            ['v3', 'V3 Терминал'],
            ['decode', 'Декод'],
            ['halo', 'Ореол'],
          ] as [WowVariant, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setWow(key)}
              className="pn-vbtn"
              data-active={wow === key}
            >
              {label}
            </button>
          ))}
        </div>
        <nav className="flex items-center gap-5">
          <Link to="/preview-redesign">Editorial draft</Link>
          <Link to="/">← Боевой сайт</Link>
        </nav>
      </div>

      <main className="relative">
        {/* key forces a remount so the chosen WOW intro replays on switch */}
        {wow === 'v3' ? <HeroV3 key="v3" /> : <HeroNext key={wow} variant={wow} />}
        <InstrumentTicker />
        <StatsNext />
        <WordmarkKinetic text="Структура " emphasis="важнее сигнала" />
        <PillarsNext />
        <WordmarkKinetic text="Допуск, " emphasis="не сигнал" />
        <FinalCTANext />
      </main>

      <footer
        className="relative border-t py-10 text-center"
        style={{ zIndex: 2, borderColor: 'hsl(var(--rule-soft))' }}
      >
        <span
          style={{
            fontFamily: "'Martian Mono', monospace", fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'hsl(var(--muted-foreground) / 0.5)',
          }}
        >
          TRADELIKETYO · Preview Next
        </span>
      </footer>
    </div>
  );
}
