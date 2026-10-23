import '@/styles/v3-skin.css';
// облик, шаг 4: проба по адресу с ?v5 (lib/lookV5.ts)
import { V5 } from '@/lib/lookV5';
import '@/styles/look-v5.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useScrollAnimate from '@/hooks/useScrollAnimate';
import { trackPageview, observeSections } from '@/lib/analytics';
import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import SideNav from '@/components/landing/SideNav';
import HeroSectionV3 from '@/components/landing/HeroSectionV3';
import StructureField from '@/components/landing/StructureField';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import CoreProblemSection from '@/components/landing/CoreProblemSection';
import FourQuestionsSection from '@/components/landing/FourQuestionsSection';
import SystemStatsSection from '@/components/landing/SystemStatsSection';
import ProofSection from '@/components/landing/ProofSection';
import TradesSection from '@/components/landing/TradesSection';
import TransformationSection from '@/components/landing/TransformationSection';
import FitSection from '@/components/landing/FitSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import FAQSection from '@/components/landing/FAQSection';
import LevelsSection from '@/components/landing/LevelsSection';
import AuthorSection from '@/components/landing/AuthorSection';
import PrincipleSection from '@/components/landing/PrincipleSection';
import DualCTASection from '@/components/landing/DualCTASection';
import Footer from '@/components/landing/Footer';
import WordmarkKinetic from '@/components/preview-next/WordmarkKinetic';
import useLandingFx from '@/hooks/useLandingFx';
import ScrollProgress from '@/components/fx/ScrollProgress';

/** Блоки, по которым считаем, до чего люди доскролливают (воронка внимания). */
const TRACKED_SECTIONS = [
  'hero', 'problem', 'filter', 'week', 'proof', 'stats', 'trades',
  'difference', 'questions', 'formats', 'author', 'faq',
];

const Index = () => {
  useScrollAnimate();
  // 23.10.2026: разделы собираются по частям, свет на карточках, лучи (styles/fx.css)
  useLandingFx();

  // Переход по якорю (/#formats, /#echo-gate): со старого адреса /access, из кабинета, из бота.
  // При переходе внутри сайта браузер сам к якорю не прокручивает, а при открытии страницы
  // секция может ещё не отрисоваться — ждём её до 2 с.
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      // отступ под закреплённую шапку, иначе заголовок раздела уходит под неё
      if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64 }); window.clearInterval(timer); }
      else if (++tries > 20) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [hash]);

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
      {/* облик, шаг 4 (проба ?v5): без фона с точками за всей страницей и без полосы прочитанного */}
      {!V5 && <StructureField position="fixed" zIndex={-1} opacity={0.6} mask="radial-gradient(130% 110% at 50% 42%, #000 38%, transparent 90%)" />}
      {!V5 && <ScrollProgress />}
      <Header />
      <StickyHeader />
      <SideNav />
      <main>
        {/* Перестроено 13.09.2026 под «ПОРТРЕТ КЛИЕНТА.md». Логика пути:
            это для меня? → да, это про меня → точно для меня → как это впишется
            в мою жизнь → это работает? → чем отличается → что я получаю →
            попробовать бесплатно → сколько стоит → кто автор → последние сомнения.
            По аналитике 14.08–13.09 половина уходит сразу после первого экрана,
            поэтому фильтр и распорядок подняты наверх. */}

        {/* Это для меня? */}
        <HeroSectionV3 />
        <InstrumentTicker />
        {/* Полоса цифр (StatsCounter) с 11.10.2026 в блоке «Автор»: повторяла первый экран и «Результаты» */}

        {/* Да, это про меня */}
        <CoreProblemSection />

        {/* Точно ли для меня — отсев до лички */}
        <FitSection />

        {/* Как это впишется в мою жизнь — УТП простым языком */}
        <TransformationSection />

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Система, " emphasis="не эмоция" />

        {/* Это работает? */}
        <ProofSection />
        <SystemStatsSection />
        <TradesSection />

        {/* Чем это отличается от того, что я уже пробовал */}
        <ComparisonSection />

        {/* Что я получаю. Блоки «Архитектура» (Trend Hunter, H4, W1/D1) и
            «Чему вы учитесь» («соберите свою систему») сняты: первый — приманка
            для коллекционера инструментов, второй продаёт свободу трактовки,
            а клиент хочет правило. Файлы оставлены. */}
        {/* 11.10.2026, сайт говорит одно: «Попробуйте мою систему, не изучая её». Сняты с главной
            (Сергей: «в целом согласен, действуй»), файлы оставлены:
            «08 · Что входит» повторял «Неделю по системе» (терминал, вердикт, 2 действия, советник);
            «10 · Защита капитала» стал строкой в «Неделе»; «11 · Путь» (5 этапов обучения) живёт на /access;
            «★ Вердикт» остался строкой в «Сотрудничестве» и вторым входом на /access. */}
        <FourQuestionsSection />
        {/* «Два этапа: школа, потом экосистема только выпускникам» снят 07.10.2026:
            спорил с линейкой «два пути». Файл оставлен. */}

        {/* Мысль-делитель */}
        <WordmarkKinetic text="Допуск, " emphasis="не сигнал" />

        {/* Сколько стоит и кто автор */}
        <LevelsSection />
        <AuthorSection />
        <PrincipleSection />

        {/* Последние сомнения перед действием */}
        <FAQSection />

        <DualCTASection />
        {/* видео с логотипом снято 11.10.2026: стояло после последней кнопки и много весило */}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
