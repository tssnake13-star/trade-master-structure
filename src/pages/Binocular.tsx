import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import SiteLayout from '@/components/site/SiteLayout';
import PageHero from '@/components/site/PageHero';
import NextPages from '@/components/site/NextPages';
import TransformationSection from '@/components/landing/TransformationSection';
import FourQuestionsSection from '@/components/landing/FourQuestionsSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import FAQSection from '@/components/landing/FAQSection';
import WordmarkKinetic from '@/components/preview-next/WordmarkKinetic';
import {
  RolesSection, RobotGuardSection, FreeWeekSection, SubscriptionPricesSection, StartAndFitSection, BINOCULAR_FAQ,
} from '@/components/site/BinocularSections';
// 29.10.2026, Сергей: «картинку надо поменять, чтобы она соответствовала… хорошего качества» — настоящий терминал v2
// глазами подписчика, снят в двойной плотности
import terminalShot from '@/assets/site/terminal-2026-10-29.webp';
import terminalShotSm from '@/assets/site/terminal-2026-10-29-1100.webp';

/**
 * «Бинокль» — подписка ECHO-GATE INSIDE (28.10.2026, сайт из нескольких страниц, «Ночной кабинет»).
 * Торговать по моей системе, не изучая её: как устроено, кто что делает, 7 дней, цены, кому не подойдёт.
 */
export default function Binocular() {
  return (
    <SiteLayout
      path="/binocular"
      title="Бинокль — торговать по системе Сергея Тё, не изучая её · TRADE LIKE TYO"
      description="Подписка ECHO-GATE INSIDE: программа смотрит весь рынок, Сергей даёт вердикт по каждой сделке, робот ведёт сделку, страж счёта держит лимиты. 7 дней бесплатно, первый месяц $199."
      sections={['top', 'week', 'roles', 'questions', 'robot', 'free', 'difference', 'prices', 'fit', 'faq', 'next']}
    >
      <PageHero
        title="Я смотрю весь рынок за вас."
        lede="И про каждую сделку говорю, беру я её или нет, и почему. Это подписка ECHO-GATE INSIDE: вы нажимаете кнопку, дальше сделку ведёт робот."
        actions={
          <>
            <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" data-orbit="" onClick={() => trackClick('binocular_hero_trial')}
              className="cta-trial v3h-btn v3h-btn--solid">
              7 дней бесплатно
            </a>
            <a href="#prices" className="v3h-btn v3h-btn--ghost"><span className="cta-shine-text">Стоимость ниже ↓</span></a>
          </>
        }
        aside={
          <figure className="ns-glass ns-reveal p-2 md:p-2.5 m-0">
            <figcaption className="flex items-center justify-between gap-3 px-2 pt-1 pb-2.5 ns-cap">
              <span className="flex items-center gap-2">
                <i className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--v3-admit)', boxShadow: '0 0 8px var(--v3-admit)' }} />
                ECHO-GATE INSIDE
              </span>
              <span>снимок 29.10.2026</span>
            </figcaption>
            <div className="overflow-hidden rounded-[5px]">
              <img src={terminalShot} srcSet={`${terminalShotSm} 1100w, ${terminalShot} 2200w`} sizes="(min-width: 1024px) 640px, 100vw"
                alt="Экран программы ECHO-GATE INSIDE: приборы, список пар, решение по неделе и дневке, анализ циклов" width={2200} height={1224} className="w-full h-auto block" />
            </div>
          </figure>
        }
      />
      <TransformationSection />
      <RolesSection />
      <FourQuestionsSection />
      <RobotGuardSection />
      <FreeWeekSection />
      <WordmarkKinetic text="Допуск, " emphasis="не сигнал" />
      <ComparisonSection />
      <SubscriptionPricesSection />
      <StartAndFitSection />
      <FAQSection title="Вопросы о подписке" items={BINOCULAR_FAQ} />
      <NextPages
        items={[
          { to: '/microscope', title: 'Микроскоп', text: 'Хотите сами понимать, почему цена идёт туда, куда идёт? Видеообучение, практикум и VIP.' },
          { to: '/author', title: 'Об авторе', text: '15 лет в рынке, путь к своей системе и отзывы учеников.' },
        ]}
      />
    </SiteLayout>
  );
}
