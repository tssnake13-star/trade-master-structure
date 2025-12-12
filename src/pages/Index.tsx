import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import WhatGoesWrongSection from '@/components/landing/WhatGoesWrongSection';
import AlgorithmSection from '@/components/landing/AlgorithmSection';
import ProofSection from '@/components/landing/ProofSection';
import StagesSection from '@/components/landing/StagesSection';
import PhilosophySection from '@/components/landing/PhilosophySection';
import ResultsSection from '@/components/landing/ResultsSection';
import FormatsSection from '@/components/landing/FormatsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <WhatGoesWrongSection />
        <AlgorithmSection />
        <ProofSection />
        <StagesSection />
        <PhilosophySection />
        <ResultsSection />
        <FormatsSection />
        <AuthorSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
