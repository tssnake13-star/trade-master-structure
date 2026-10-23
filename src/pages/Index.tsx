import '@/styles/v3-skin.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview, observeSections } from '@/lib/analytics';
import Header from '@/components/landing/Header';
import StickyHeader from '@/components/landing/StickyHeader';
import SideNav from '@/components/landing/SideNav';
import HeroSectionV3 from '@/components/landing/HeroSectionV3';
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

/** Блоки, по которым считаем, до чего люди доскролливают (воронка внимания). */
const TRACKED_SECTIONS = [
  'hero', 'problem', 'filter', 'week', 'proof', 'stats', 'trades',
  'difference', 'questions', 'formats', 'author', 'faq',
];

/**
 * Мысль-делитель между разделами: крупные бледные слова. Облик, шаг 4 (23.10.2026): «вау» только
 * на первом экране, ниже ничего не движется само, поэтому слова стоят (прежде буквы шли волной при прокрутке).
 */
const Thought = ({ text, emphasis }: { text: string; emphasis: string }) => (
  <div className="py-20 md:py-28 overflow-hidden relative" style={{ zIndex: 2 }}>
    <div className="pn-wordmark">{text}<em>{emphasis}</em></div>
  </div>
);

const Index = () => {
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
      {/* Облик, шаг 4 (23.10.2026, Сергей: «Ставь четвёртый шаг»): движение только на первом экране.
          Сняты фон с точками за всей страницей, полоса прочитанного, проявление разделов целиком и по словам,
          лучи по рамкам, свет за курсором, лампа, мерцание и блик кнопок, бегущая строка. Остаётся движение,
          которое отвечает на действие (наведение, открытие ответа), живой макет терминала и кольцо в конце. */}
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
        <Thought text="Система, " emphasis="не эмоция" />

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
        <Thought text="Допуск, " emphasis="не сигнал" />

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
