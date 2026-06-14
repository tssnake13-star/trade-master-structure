import useScrollAnimate from '@/hooks/useScrollAnimate';
import ConstellationBg from '@/components/ConstellationBg';
import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import SideNav from '@/components/landing/SideNav';
import HeroSection from '@/components/landing/HeroSection';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import StatsCounter from '@/components/landing/StatsCounter';
import TwoStagesSection from '@/components/landing/TwoStagesSection';
import CoreProblemSection from '@/components/landing/CoreProblemSection';
import StructureDiagram from '@/components/landing/StructureDiagram';
import IncludedSection from '@/components/landing/IncludedSection';
import TradingSystemSection from '@/components/landing/TradingSystemSection';
import CapitalProtectionSection from '@/components/landing/CapitalProtectionSection';
import SystemStatsSection from '@/components/landing/SystemStatsSection';
import ProofSection from '@/components/landing/ProofSection';
import TradesSection from '@/components/landing/TradesSection';
import WorkWeekSection from '@/components/landing/WorkWeekSection';
import StagesSection from '@/components/landing/StagesSection';
import FitSection from '@/components/landing/FitSection';
import LevelsSection from '@/components/landing/LevelsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import PrincipleSection from '@/components/landing/PrincipleSection';
import DualCTASection from '@/components/landing/DualCTASection';
import LogoSection from '@/components/landing/LogoSection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  useScrollAnimate();

  return (
    <div className="min-h-screen bg-background landing-skin">
      <ConstellationBg />
      <Header />
      <StickyHeader />
      <SideNav />
      <main>
        {/* Внимание */}
        <HeroSection />
        <InstrumentTicker />
        <StatsCounter />
        <TwoStagesSection />

        {/* Боль */}
        <CoreProblemSection />

        {/* Решение */}
        <StructureDiagram />
        <IncludedSection />
        <TradingSystemSection />

        {/* Доверие / доказательства */}
        <CapitalProtectionSection />
        <SystemStatsSection />
        <ProofSection />
        <TradesSection />

        {/* Образ жизни */}
        <WorkWeekSection />

        {/* Путь и фильтр */}
        <StagesSection />
        <FitSection />

        {/* Оффер и действие */}
        <LevelsSection />
        <AuthorSection />
        <PrincipleSection />
        <DualCTASection />
        <LogoSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
