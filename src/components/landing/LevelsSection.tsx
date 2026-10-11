import { TELEGRAM_LINKS } from '@/lib/constants';
import PackageCards from './PackageCards';
import RouteChooser from './RouteChooser';

/**
 * «09 · Сотрудничество» (до 11.10.2026 — 12) — линейка «вход и два пути» (Сергей 07.10.2026).
 * С 08.10.2026 блок двухэтажный, как страница цен («на лендинге тоже поправь»):
 * наверху выбор (RouteChooser), сразу под ним карточки, ниже схема для тех, кто хочет разобраться.
 * На лендинге цены только у курса ($349) и практикума ($499); цены подписки
 * ECHO-GATE INSIDE и VIP — только на /access.
 */
const LevelsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/40 border-y border-border">
      <div className="container-landing">
        <RouteChooser showPrices={false} heading="h2" kicker="09 · Сотрудничество" clickPrefix="landing" />

        <div className="mt-10 md:mt-14">
          {/* цены подписки и VIP здесь не раскрываются — только на /access */}
          <PackageCards showPrices={false} choiceNote="bottom" />
        </div>

        {/* 11.10.2026: схема «Два пути. Один алгоритм.» снята с главной — два пути здесь
            показывались трижды подряд (выбор, карточки, схема). На /access схема осталась. */}
        <p className="mt-8 md:mt-10 text-center text-sm text-muted-foreground">
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
