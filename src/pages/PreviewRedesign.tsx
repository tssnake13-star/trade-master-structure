import { Link } from 'react-router-dom';
import useScrollAnimate from '@/hooks/useScrollAnimate';
import useReveal from '@/hooks/useReveal';

import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import StatsCounter from '@/components/landing/StatsCounter';
import NotBeginnersSection from '@/components/landing/NotBeginnersSection';
import WhyCoursesFailSection from '@/components/landing/WhyCoursesFailSection';
import DecisionProcessSection from '@/components/landing/DecisionProcessSection';
import ProblemSection from '@/components/landing/ProblemSection';
import WhatGoesWrongSection from '@/components/landing/WhatGoesWrongSection';
import StructureDiagram from '@/components/landing/StructureDiagram';
import TradingSystemSection from '@/components/landing/TradingSystemSection';
import ProofSection from '@/components/landing/ProofSection';
import TradesSection from '@/components/landing/TradesSection';
import StagesSection from '@/components/landing/StagesSection';
import ResultsSection from '@/components/landing/ResultsSection';
import FitSection from '@/components/landing/FitSection';
import FormatsSection from '@/components/landing/FormatsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import DualCTASection from '@/components/landing/DualCTASection';
import LogoSection from '@/components/landing/LogoSection';
import Footer from '@/components/landing/Footer';

import RedesignHero from '@/components/redesign/RedesignHero';
import SideProgress from '@/components/redesign/SideProgress';

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
        <span className="pv-banner__label">Preview · Redesign draft · Stage 1/5</span>
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
        <StatsCounter />

        {/* Будет заменено на WhyStuckSection (этап 2 — пока оставляем отдельные блоки) */}
        <div id="why">
          <NotBeginnersSection />
          <WhyCoursesFailSection />
          <DecisionProcessSection />
          <ProblemSection />
          <WhatGoesWrongSection />
        </div>

        {/* Будет заменено на RedesignArchitecture с горизонтальным таймлайном + SVG (этап 2) */}
        <div id="system">
          <StructureDiagram />
          <TradingSystemSection />
        </div>

        {/* Этап 3 */}
        <div id="proof">
          <ProofSection />
        </div>
        <div id="voices">
          <TradesSection />
          <StagesSection />
          <ResultsSection />
        </div>

        {/* Этап 4 */}
        <div id="formats">
          <FitSection />
          <FormatsSection />
        </div>

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
