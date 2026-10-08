import { TELEGRAM_LINKS } from '@/lib/constants';
import PackageCards from './PackageCards';
import RouteChooser from './RouteChooser';
import TwoPathsScheme from './TwoPathsScheme';

/**
 * «12 · Сотрудничество» — линейка «вход и два пути» (Сергей 07.10.2026).
 * С 08.10.2026 блок двухэтажный, как страница цен («на лендинге тоже поправь»):
 * наверху выбор (RouteChooser), сразу под ним карточки, ниже схема для тех, кто хочет разобраться.
 * На лендинге цены только у курса ($349) и практикума ($499); цены подписки
 * ECHO-GATE INSIDE и VIP — только на /access.
 */
const LevelsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/40 border-y border-border">
      <div className="container-landing">
        <RouteChooser showPrices={false} heading="h2" kicker="12 · Сотрудничество" clickPrefix="landing" />

        <div className="mt-10 md:mt-14">
          {/* цены подписки и VIP здесь не раскрываются — только на /access */}
          <PackageCards showPrices={false} choiceNote="bottom" />
        </div>

        <div className="mt-14 md:mt-20 max-w-3xl">
          <h3 className="text-foreground" style={{ fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.05 }}>
            Два пути. <em>Один алгоритм.</em>
          </h3>
          <p className="mt-3 text-base text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Можно торговать по системе, не изучая её целиком: терминал считает рынок, сделку ведёт
            советник, от вас 2 действия. А можно изучить систему, самому или вместе со мной.
          </p>
        </div>

        <div className="mt-8 md:mt-10">
          <TwoPathsScheme showPrices={false} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Каждую заявку разбираю лично. Если вам ко мне пока рано, скажу прямо ·{' '}
          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            задать вопрос Сергею
          </a>
        </p>
      </div>
    </section>
  );
};

export default LevelsSection;
