import SiteLayout from '@/components/site/SiteLayout';
import PageHero from '@/components/site/PageHero';
import NextPages from '@/components/site/NextPages';
import ProofSection from '@/components/landing/ProofSection';
import FAQSection from '@/components/landing/FAQSection';
import {
  StudyPriceCard, StagesSection, StudyLevelsSection, FirstBlockSection, SchoolMapSection, MICROSCOPE_FAQ,
} from '@/components/site/MicroscopeSections';

/**
 * «Микроскоп» — обучение (28.10.2026, сайт из нескольких страниц, «Ночной кабинет»).
 * Для тех, кто хочет решать сам: 5 этапов, три ступени, правило первого блока, отзывы, карта школы.
 */
export default function Microscope() {
  return (
    <SiteLayout
      path="/microscope"
      title="Микроскоп — обучение системе Сергея Тё · TRADE LIKE TYO"
      description="Научитесь видеть рынок сами: 5 этапов до реального рынка, видеообучение Trade System, практикум со мной и VIP. Правило первого блока на практикуме."
      sections={['top', 'stages', 'levels', 'rule', 'proof', 'map', 'faq', 'next']}
    >
      <PageHero
        title="Научитесь видеть рынок сами."
        lede="Почему цена идёт туда, куда идёт, и где в неё входить. Торговать по системе можно и без учёбы, для этого есть бинокль. Учатся те, кто хочет принимать решения сам."
        actions={
          <>
            <a href="#levels" data-orbit="" className="v3h-btn v3h-btn--solid">Стоимость ниже ↓</a>
            <a href="#stages" className="v3h-btn v3h-btn--ghost"><span className="cta-shine-text">5 этапов ниже ↓</span></a>
          </>
        }
        aside={<StudyPriceCard />}
      />
      <StagesSection />
      <StudyLevelsSection />
      <FirstBlockSection />
      <ProofSection names={['Lesia', 'Николай', 'Елена', 'Рустам']} />
      <SchoolMapSection />
      <FAQSection title="Вопросы об обучении" items={MICROSCOPE_FAQ} />
      <NextPages
        items={[
          { to: '/binocular', title: 'Бинокль', text: 'Торговать по моей системе, не изучая её. 7 дней бесплатно.' },
          { to: '/author', title: 'Об авторе', text: '15 лет в рынке и путь к своей системе.' },
        ]}
      />
    </SiteLayout>
  );
}
