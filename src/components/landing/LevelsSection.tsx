import { TELEGRAM_LINKS } from '@/lib/constants';
import PackageCards from './PackageCards';
import TwoPathsScheme from './TwoPathsScheme';

/**
 * «12 · Сотрудничество» — линейка «вход и два пути» (Сергей 07.10.2026).
 * На лендинге цены только у курса ($349) и практикума ($499); цены подписки
 * ECHO-GATE INSIDE и VIP — только на /access.
 */
const LevelsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/40 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">12 · Сотрудничество</span>
          <h2 className="text-foreground">
            Два пути. <em>Один алгоритм.</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Можно торговать по системе, не изучая её целиком: рынок считает терминал, исполняет
            советник, от вас 2 действия. А можно изучить систему, самому или вместе со мной.
          </p>
        </div>

        <div className="mt-8 md:mt-12">
          <TwoPathsScheme showPrices={false} />
        </div>

        <div className="mt-10 md:mt-14">
          {/* цены подписки и VIP здесь не раскрываются — только на /access */}
          <PackageCards showPrices={false} />
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
