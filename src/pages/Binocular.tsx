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
      description="Подписка ECHO-GATE INSIDE: программа смотрит весь рынок, Сергей даёт вердикт по каждой сделке, робот ведёт сделку, страж счёта держит лимиты. 7 дней бесплатно, первый месяц $196."
      sections={['top', 'week', 'roles', 'questions', 'robot', 'free', 'difference', 'prices', 'fit', 'faq', 'next']}
    >
      <PageHero
        // 31.10.2026, его подход: «участие человека сводится к минимуму, но этот минимум и есть максимум»
        title={<>Программа смотрит весь рынок, я говорю, что беру. <span className="block">Где войти, решаете вы.</span></>}
        longTitle
        // 31.10.2026, Сергей: «с компьютера она маленькая, плохо видно, что написано». На планшете всё видно: там снимок во всю ширину
        asideBelow
        lede="Про каждую сделку объясняю, почему беру её или нет. Это подписка ECHO-GATE INSIDE. Зону и точку входа определяете вы и нажимаете кнопку: это ключевой шаг, без него сделки нет. Дальше её ведёт Hunter_Bot."
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
              <img src={terminalShot} srcSet={`${terminalShotSm} 1100w, ${terminalShot} 2200w`} sizes="(min-width: 1280px) 1216px, 100vw"
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
