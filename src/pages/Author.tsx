import SiteLayout from '@/components/site/SiteLayout';
import PageHero from '@/components/site/PageHero';
import NextPages from '@/components/site/NextPages';
import PrincipleSection from '@/components/landing/PrincipleSection';
import ProofSection from '@/components/landing/ProofSection';
import { NumbersSection } from '@/components/site/MainSections';
import { AuthorPhoto, PathSection, SeriesSection } from '@/components/site/AuthorSections';

/**
 * «Об авторе» (28.10.2026, сайт из нескольких страниц, «Ночной кабинет»). Сергей: «отдельная страница об авторе».
 * Путь датирован и закрыт тем, что работает сегодня (CLAUDE.md, «У откровенности есть потолок»).
 */
export default function Author() {
  return (
    <SiteLayout
      path="/author"
      title="Сергей Тё — 15 лет в рынке · TRADE LIKE TYO"
      description="Практикующий трейдер, архитектор торговых систем. Путь до своей системы, главный принцип, счёт и отзывы учеников."
      sections={['top', 'path', 'principle', 'stats', 'proof', 'series', 'next']}
    >
      <PageHero
        title="15 лет в рынке."
        lede="Я Сергей Тё, архитектор торговых систем. Торгую по той же системе, которую даю вам попробовать."
        note="Практикующий трейдер. Не сигнальщик и не инфобизнесмен."
        aside={<AuthorPhoto />}
      />
      <PathSection />
      <PrincipleSection />
      <NumbersSection
        title="Мой счёт"
        caption="Депозит $50 000, риск 0,25% на сделку, январь 2025 — октябрь 2026. Прошлый результат не гарантирует будущий."
      />
      {/* 28.10.2026, Сергей: «Почему на странице автора не все отзывы?» — здесь все отзывы, на «Микроскопе» четыре */}
      <ProofSection title="Что пишут ученики" />
      <SeriesSection />
      <NextPages
        items={[
          { to: '/binocular', title: 'Бинокль', text: 'Торговать по моей системе, не изучая её. 7 дней бесплатно.' },
          { to: '/microscope', title: 'Микроскоп', text: 'Научиться видеть рынок самому: видеообучение, практикум и VIP.' },
        ]}
      />
    </SiteLayout>
  );
}
