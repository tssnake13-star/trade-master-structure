import { TELEGRAM_LINKS } from '@/lib/constants';
import PackageCards from './PackageCards';
import RouteChooser from './RouteChooser';
import SchoolMapVideo from './SchoolMapVideo';

/**
 * «09 · Сотрудничество» (до 11.10.2026 — 12) — линейка «вход и два пути» (Сергей 07.10.2026).
 * С 08.10.2026 блок двухэтажный, как страница цен («на лендинге тоже поправь»):
 * наверху выбор (RouteChooser), сразу под ним карточки, ниже схема для тех, кто хочет разобраться.
 * 20.10.2026: цены курса, практикума и подписки видны здесь; цена VIP — только во вкладке «Цены»
 * терминала школьного бота. 22.10.2026 страница цен /access убрана и переадресует сюда (#formats),
 * а её схему путей и 5 этапов теперь объясняет ролик «Карта школы» под карточками.
 */
const LevelsSection = () => {
  return (
    <section id="formats" className="relative py-12 md:py-20 bg-card/40 border-y border-border">
      <div className="container-landing relative">
        <RouteChooser showPrices={false} heading="h2" clickPrefix="landing" />

        <div className="mt-10 md:mt-14">
          <PackageCards showPrices={false} choiceNote="bottom" />
        </div>

        {/* 11.10.2026 отсюда сняли схему «Два пути. Один алгоритм.» (два пути показывались трижды подряд).
            22.10.2026 на её месте ролик «Карта школы»: оба пути от двери до реального рынка за 4,5 минуты. */}
        <div className="mt-10 md:mt-14">
          <SchoolMapVideo />
        </div>
        <p className="mt-8 md:mt-10 text-center text-sm text-muted-foreground">
          Каждую заявку разбираю лично. Если вам ко мне пока рано, скажу прямо.{' '}
          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            Задать вопрос Сергею
          </a>
        </p>
      </div>
    </section>
  );
};

export default LevelsSection;
