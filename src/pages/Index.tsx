import '@/styles/v3-skin.css';
import { useEffect } from 'react';
import useScrollAnimate from '@/hooks/useScrollAnimate';
import { trackPageview, observeSections } from '@/lib/analytics';
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
import FourQuestionsSection from '@/components/landing/FourQuestionsSection';
import WhatYouLearnSection from '@/components/landing/WhatYouLearnSection';
import TradingSystemSection from '@/components/landing/TradingSystemSection';
import CapitalProtectionSection from '@/components/landing/CapitalProtectionSection';
import SystemStatsSection from '@/components/landing/SystemStatsSection';
import ProofSection from '@/components/landing/ProofSection';
import TradesSection from '@/components/landing/TradesSection';
import TransformationSection from '@/components/landing/TransformationSection';
import StagesSection from '@/components/landing/StagesSection';
import FitSection from '@/components/landing/FitSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import FAQSection from '@/components/landing/FAQSection';
import AdmissionCheckSection from '@/components/landing/AdmissionCheckSection';
import LevelsSection from '@/components/landing/LevelsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import PrincipleSection from '@/components/landing/PrincipleSection';
import DualCTASection from '@/components/landing/DualCTASection';
import LogoSection from '@/components/landing/LogoSection';
import Footer from '@/components/landing/Footer';
import WordmarkKinetic from '@/components/preview-next/WordmarkKinetic';

/** Блоки, по которым считаем, до чего люди доскролливают (воронка внимания). */
const TRACKED_SECTIONS = [
  'hero', 'problem', 'verdict', 'transformation', 'proof', 'stats',
  'trades', 'filter', 'difference', 'included', 'questions', 'trading-system',
  'protection', 'stages', 'learn', 'formats', 'author', 'faq',
];

const Index = () => {
  useScrollAnimate();

  useEffect(() => {
    trackPageview('/');
    // секции появляются после первого рендера — подписываемся с небольшой задержкой
    let disconnect: (() => void) | null = null;
    const timer = window.setTimeout(() => { disconnect = observeSections(TRACKED_SECTIONS); }, 400);
    return () => {
      window.clearTimeout(timer);
      disconnect?.();
    };
  }, []);

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

        {/* Первое действие — сразу после боли: личный разбор своих сделок (лид-магнит + фильтр).
            Боль подводит к офферу «покажу, где ЛИЧНО у вас система сказала бы нет». */}
        <AdmissionCheckSection />

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

        {/* Отстройка: чем система отличается от сигналов и «ещё одного курса» */}
        <ComparisonSection />

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Структура " emphasis="важнее сигнала" />

        {/* Механика системы */}
        <IncludedSection />

        {/* Суть метода: четыре вопроса, на которые отвечает любая сделка.
            Стоит после состава — сначала «из чего», сразу за ним «по какому правилу». */}
        <FourQuestionsSection />

        <TradingSystemSection />
        <CapitalProtectionSection />
        <StagesSection />

        {/* Снимает возражение «зачем мне чужая стратегия» — до того, как человек
            увидит цену. */}
        <WhatYouLearnSection />

        {/* Структура оффера */}
        <TwoStagesSection />

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Допуск, " emphasis="не сигнал" />

        {/* Оффер и действие */}
        <LevelsSection />
        <AuthorSection />
        <PrincipleSection />

        {/* Последние сомнения перед действием */}
        <FAQSection />

        <DualCTASection />
        <LogoSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
