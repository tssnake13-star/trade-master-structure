import '@/styles/v3-skin.css';
import useScrollAnimate from '@/hooks/useScrollAnimate';
import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import SideNav from '@/components/landing/SideNav';
import HeroSectionV3 from '@/components/landing/HeroSectionV3';
import StructureField from '@/components/landing/StructureField';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import StatsCounter from '@/components/landing/StatsCounter';
import TwoStagesSection from '@/components/landing/TwoStagesSection';
import CoreProblemSection from '@/components/landing/CoreProblemSection';
import IncludedSection from '@/components/landing/IncludedSection';
import TradingSystemSection from '@/components/landing/TradingSystemSection';
import CapitalProtectionSection from '@/components/landing/CapitalProtectionSection';
import SystemStatsSection from '@/components/landing/SystemStatsSection';
import ProofSection from '@/components/landing/ProofSection';
import TradesSection from '@/components/landing/TradesSection';
import TransformationSection from '@/components/landing/TransformationSection';
import StagesSection from '@/components/landing/StagesSection';
import FitSection from '@/components/landing/FitSection';
import AdmissionCheckSection from '@/components/landing/AdmissionCheckSection';
import LevelsSection from '@/components/landing/LevelsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import PrincipleSection from '@/components/landing/PrincipleSection';
import DualCTASection from '@/components/landing/DualCTASection';
import LogoSection from '@/components/landing/LogoSection';
import Footer from '@/components/landing/Footer';
import WordmarkKinetic from '@/components/preview-next/WordmarkKinetic';

const Index = () => {
  useScrollAnimate();

  return (
    <div className="min-h-screen bg-background landing-skin v3-skin relative isolate">
      {/* site-wide "Структура" ambient field — behind all content (hero keeps its own) */}
      <StructureField position="fixed" zIndex={-1} opacity={0.6} mask="radial-gradient(130% 110% at 50% 42%, #000 38%, transparent 90%)" />
      <Header />
      <StickyHeader />
      <SideNav />
      <main>
        {/* Внимание */}
        <HeroSectionV3 />
        <InstrumentTicker />
        <StatsCounter />

        {/* Боль */}
        <CoreProblemSection />

        {/* Состояние: что меняется в поведении (до механики) */}
        <TransformationSection />

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Система, " emphasis="не эмоция" />

        {/* Доверие / доказательства */}
        <ProofSection />
        <SystemStatsSection />
        <TradesSection />

        {/* Фильтр: это подойдёт не всем — сразу после живой сделки */}
        <FitSection />

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Структура " emphasis="важнее сигнала" />

        {/* Механика системы */}
        <IncludedSection />
        <TradingSystemSection />
        <CapitalProtectionSection />
        <StagesSection />

        {/* Структура оффера */}
        <TwoStagesSection />

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Допуск, " emphasis="не сигнал" />

        {/* Интерактив: проверь сетап через допуск */}
        <AdmissionCheckSection />

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
