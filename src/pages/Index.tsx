import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import NotBeginnersSection from '@/components/landing/NotBeginnersSection';
import WhyCoursesFailSection from '@/components/landing/WhyCoursesFailSection';
import DecisionProcessSection from '@/components/landing/DecisionProcessSection';

import UniquenessSection from '@/components/landing/UniquenessSection';
import ProblemSection from '@/components/landing/ProblemSection';
import WhatGoesWrongSection from '@/components/landing/WhatGoesWrongSection';
import StructureDiagram from '@/components/landing/StructureDiagram';
import TradingSystemSection from '@/components/landing/TradingSystemSection';
import DisciplineSection from '@/components/landing/DisciplineSection';
import ProofSection from '@/components/landing/ProofSection';
import TradesSection from '@/components/landing/TradesSection';
import StagesSection from '@/components/landing/StagesSection';

import ResultsSection from '@/components/landing/ResultsSection';
import FitSection from '@/components/landing/FitSection';
import FormatsSection from '@/components/landing/FormatsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LogoSection from '@/components/landing/LogoSection';
import Footer from '@/components/landing/Footer';
import StickyButton from '@/components/landing/StickyButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <NotBeginnersSection />
        <WhyCoursesFailSection />
        <DecisionProcessSection />
        
        <UniquenessSection />
        <ProblemSection />
        <WhatGoesWrongSection />
        <StructureDiagram />
        <TradingSystemSection />
        <DisciplineSection />
        
        <ProofSection />
        <TradesSection />
        <StagesSection />
        
        <ResultsSection />
        <FitSection />
        <FormatsSection />
        <AuthorSection />
        <FinalCTASection />
        <LogoSection />
      </main>
      <Footer />
      <StickyButton />
    </div>
  );
};

export default Index;
