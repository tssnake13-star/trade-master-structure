import useScrollAnimate from '@/hooks/useScrollAnimate';
import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import SideNav from '@/components/landing/SideNav';
import HeroSection from '@/components/landing/HeroSection';
import StatsCounter from '@/components/landing/StatsCounter';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import TwoStagesSection from '@/components/landing/TwoStagesSection';
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


const Index = () => {
  useScrollAnimate();

  return (
    <div className="min-h-screen bg-background landing-skin">
      <Header />
      <StickyHeader />
      <SideNav />
      <main>
        <HeroSection />
        <InstrumentTicker />
        <StatsCounter />
        <TwoStagesSection />
        <NotBeginnersSection />
        <WhyCoursesFailSection />
        <DecisionProcessSection />
        
        
        <ProblemSection />
        <WhatGoesWrongSection />
        <StructureDiagram />
        <TradingSystemSection />

        <ProofSection />
        <TradesSection />
        <StagesSection />
        
        <ResultsSection />
        <FitSection />
        <FormatsSection />
        <AuthorSection />
        
        <DualCTASection />
        <LogoSection />
      </main>
      <Footer />
      
    </div>
  );
};

export default Index;
