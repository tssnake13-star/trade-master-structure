import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import HeroSectionV3 from '@/components/landing/HeroSectionV3';
import InstrumentTicker from '@/components/landing/InstrumentTicker';
import TradesSection from '@/components/landing/TradesSection';
import DualCTASection from '@/components/landing/DualCTASection';
import WordmarkKinetic from '@/components/preview-next/WordmarkKinetic';
import { PainsSection, StepsSection, NumbersSection, PathsSection, AuthorTeaser } from '@/components/site/MainSections';

/**
 * Главная (28.10.2026, сайт из нескольких страниц, «Ночной кабинет»). Сергей: «первая страница — по болям…
 * отдельную страницу под бинокль, под микроскоп… отдельная страница об авторе». Главная — развилка:
 * каждый раздел коротко и ведёт на свою страницу.
 *
 * Прежняя главная одной страницей (13.09–28.10.2026) — в истории git; её разделы-файлы оставлены.
 */

// Старые ссылки на разделы прежней главной (из бота, кабинета, описаний роликов) ведут туда, где эти разделы теперь
const LEGACY_HASH: Record<string, string> = {
  formats: '/#paths',
  'echo-gate': '/binocular#prices',
  week: '/binocular#week',
  questions: '/binocular#questions',
  difference: '/binocular#difference',
  faq: '/binocular#faq',
  proof: '/microscope#proof',
  filter: '/binocular#fit',
};

const Index = () => {
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const to = LEGACY_HASH[decodeURIComponent(hash.slice(1))];
    if (to && to !== `/${hash}`) navigate(to, { replace: true });
  }, [hash, navigate]);

  return (
    <SiteLayout
      path="/"
      title="TRADE LIKE TYO — торгуйте по моей системе, не изучая её"
      description="Программа каждый день смотрит весь рынок, я говорю, какую сделку беру и почему, вы отмечаете вход и нажимаете кнопку, дальше сделку ведёт робот. 7 дней бесплатно."
      sections={['hero', 'pains', 'how', 'stats', 'trades', 'paths', 'author']}
    >
      <HeroSectionV3 />
      <InstrumentTicker />
      <PainsSection />
      <StepsSection />
      <WordmarkKinetic text="Система, " emphasis="не эмоция" />
      <NumbersSection
        title="Решения, которые нельзя подделать"
        lede="Каждое моё решение записано до того, как цена пошла: беру или не беру, и почему. Убытки тоже. Дневник решений открыт всем."
        caption="Мой счёт: депозит $50 000, риск 0,25% на сделку, январь 2025 — сентябрь 2026. Прошлый результат не гарантирует будущий."
      />
      <TradesSection />
      <PathsSection />
      <AuthorTeaser />
      <DualCTASection />
    </SiteLayout>
  );
};

export default Index;
