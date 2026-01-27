import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import WhatGoesWrongSection from '@/components/landing/WhatGoesWrongSection';
import StructureDiagram from '@/components/landing/StructureDiagram';
import AlgorithmSection from '@/components/landing/AlgorithmSection';
import ProofSection from '@/components/landing/ProofSection';
import StagesSection from '@/components/landing/StagesSection';
import PhilosophySection from '@/components/landing/PhilosophySection';
import ResultsSection from '@/components/landing/ResultsSection';
import FitSection from '@/components/landing/FitSection';
import FormatsSection from '@/components/landing/FormatsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import LogoSection from '@/components/landing/LogoSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import Footer from '@/components/landing/Footer';
import StickyButton from '@/components/landing/StickyButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <WhatGoesWrongSection />
        <StructureDiagram />
        <AlgorithmSection />
        <ProofSection />
        <StagesSection />
        <PhilosophySection />
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
