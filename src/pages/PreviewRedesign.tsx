import { Link } from 'react-router-dom';
import useScrollAnimate from '@/hooks/useScrollAnimate';
import useReveal from '@/hooks/useReveal';

import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import NotBeginnersSection from '@/components/landing/NotBeginnersSection';
import WhyCoursesFailSection from '@/components/landing/WhyCoursesFailSection';
import DecisionProcessSection from '@/components/landing/DecisionProcessSection';
import ProblemSection from '@/components/landing/ProblemSection';
import WhatGoesWrongSection from '@/components/landing/WhatGoesWrongSection';
import StagesSection from '@/components/landing/StagesSection';
import ResultsSection from '@/components/landing/ResultsSection';
import FitSection from '@/components/landing/FitSection';
import AuthorSection from '@/components/landing/AuthorSection';
import DualCTASection from '@/components/landing/DualCTASection';
import LogoSection from '@/components/landing/LogoSection';
import Footer from '@/components/landing/Footer';

import RedesignHero from '@/components/redesign/RedesignHero';
import SideProgress from '@/components/redesign/SideProgress';
import RedesignArchitecture from '@/components/redesign/RedesignArchitecture';
import RedesignStats from '@/components/redesign/RedesignStats';
import RedesignProof from '@/components/redesign/RedesignProof';
import RedesignTrades from '@/components/redesign/RedesignTrades';
import RedesignFormats from '@/components/redesign/RedesignFormats';

/**
 * /preview-redesign
 *
 * Editorial redesign sandbox. Composes redesigned sections (src/components/redesign/*)
 * alongside the original landing sections still pending rework. The production
 * landing at "/" is not touched.
 *
 * Section IDs (hero, why, system, proof, voices, author, formats) are emitted
 * as wrapper anchors so SideProgress can track scroll position.
 */
const PreviewRedesign = () => {
  useScrollAnimate();
  useReveal();

  return (
    <div data-preview-skin className="min-h-screen bg-background text-foreground landing-skin">
      <div className="pv-banner">
        <span className="pv-banner__label">Preview · Redesign draft · Stage 3/5</span>
        <nav className="pv-banner__nav">
          <Link to="/" className="pv-banner__link">← Боевой сайт</Link>
        </nav>
      </div>

      <Header />
      <StickyHeader />
      <SideProgress />

      <main>
        <RedesignHero />
        <InstrumentTicker />
        <RedesignStats />

        {/* Будет заменено на WhyStuckSection (этап 2 — пока оставляем отдельные блоки) */}
        <div id="why">
          <NotBeginnersSection />
          <WhyCoursesFailSection />
          <DecisionProcessSection />
          <ProblemSection />
          <WhatGoesWrongSection />
        </div>

        {/* Этап 2 — горизонтальный таймлайн + SVG-схема Trade OS */}
        <RedesignArchitecture />

        {/* Этап 3 — газетная вёрстка */}
        <RedesignProof />
        <RedesignTrades />
        <StagesSection />
        <ResultsSection />

        {/* Этап 4 — пока остаётся FitSection в прежней вёрстке */}
        <FitSection />
        <RedesignFormats />

        {/* Этап 5 */}
        <div id="author">
          <AuthorSection />
        </div>
        <DualCTASection />
        <LogoSection />
      </main>
      <Footer />
    </div>
  );
};

export default PreviewRedesign;
