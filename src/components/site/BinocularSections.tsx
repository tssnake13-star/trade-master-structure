import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import { ECOSYSTEM } from '@/lib/prices';
import Words from '@/components/fx/Words';

/*
 * Разделы страницы «Бинокль» (28.10.2026, прототип «Ночной кабинет»). Слова простые, как в «ПРОДУКТ ПРОСТЫМИ
 * СЛОВАМИ»: программа, вердикт, робот, страж счёта. Цены — из lib/prices.ts, как у кабинета и бота.
 */

const tick = <Check size={16} className="flex-shrink-0 mt-[3px]" style={{ color: 'var(--v3-gold)' }} aria-hidden="true" />;

const BINOCULAR_DOES = [
  'Смотрит все пары каждый день',
  'Проверяет, куда рынок идёт по-крупному',
  'Я говорю «беру» или «не беру», и почему',
  'Hunter_Bot, робот-исполнитель, входит, ставит защиту, переводит сделку в ноль',
  'Risk Sentinel, страж счёта, останавливает торговлю на плохой неделе',
];
const YOU_DO = [
  'Один раз изучаете 2 урока: место входа и настройка роботов',
  'Отмечаете, где войти',
  'Нажимаете кнопку',
  'Решаете, каким риском торговать',
];

export function RolesSection() {
  return (
    <section id="roles" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <h2 className="text-foreground"><Words>Кто что делает</Words></h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <div className="ns-panel p-7 md:p-8" style={{ borderColor: 'hsl(var(--accent) / 0.4)' }}>
            <h3 className="text-foreground">Делает бинокль</h3>
            <ul className="mt-5 space-y-3.5">
              {BINOCULAR_DOES.map((t) => (
                <li key={t} className="flex gap-3 text-base md:text-[17px] text-foreground/90">{tick}<span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="ns-panel p-7 md:p-8">
            <h3 className="text-foreground">Делаете вы</h3>
            <ul className="mt-5 space-y-3.5">
              {YOU_DO.map((t, i) => (
                <li key={t} className="flex gap-3 text-base md:text-[17px] text-foreground/90">
                  <span className="ns-step-n w-4 flex-shrink-0 mt-[2px]">{i + 1}</span><span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RobotGuardSection() {
  return (
    <section id="robot" className="section-animate py-14 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground"><Words>Hunter_Bot и Risk Sentinel</Words></h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Сделку после кнопки ведёте не вы. Поэтому сомнение после входа больше ничего не решает.
          </p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <article className="ns-glass p-7 md:p-8">
            <div className="ns-kicker">робот-исполнитель · ведёт сделку</div>
            <h3 className="mt-2 text-foreground">Hunter_Bot</h3>
            <ul className="mt-5 space-y-3.5">
              {['Входит в сделку после вашей кнопки', 'Сам ставит стоп и тейк', 'Сам переводит сделку в ноль, когда цена прошла в вашу сторону'].map((t) => (
                <li key={t} className="flex gap-3 text-base md:text-[17px] text-foreground/90">{tick}<span>{t}</span></li>
              ))}
            </ul>
          </article>
          <article className="ns-glass p-7 md:p-8">
            <div className="ns-kicker">страж счёта · держит лимиты</div>
            <h3 className="mt-2 text-foreground">Risk Sentinel</h3>
            <p className="mt-4 text-base md:text-[17px] leading-relaxed text-foreground/90">
              Не даст потерять больше, чем вы сами разрешили на неделю и на месяц. Лимит ставите вы, например 5% в неделю
              и 10% в месяц. У меня 4% и 8%.
            </p>
            <div className="mt-6 flex gap-3">
              {[{ l: 'лимит недели', v: '4%' }, { l: 'лимит месяца', v: '8%' }].map((x) => (
                <div key={x.l} className="flex-1 rounded-md p-4" style={{ border: '1px solid var(--ns-line-strong)' }}>
                  <div className="ns-cap">{x.l}</div>
                  <div className="ns-num mt-2 text-[40px]">{x.v}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 ns-cap">Мои настройки. Дошли до лимита, и новые сделки не открываются.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function FreeWeekSection() {
  return (
    <section id="free" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <h2 className="text-foreground"><Words>Сначала посмотрите, как я решаю</Words></h2>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">7 дней бесплатно, всё открыто.</p>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <article className="ns-panel p-6 md:p-7">
            <h3 className="text-foreground">Дневник решений</h3>
            <p className="mt-3 text-[15px] md:text-base leading-relaxed text-muted-foreground">
              Каждое моё решение записано до того, как цена пошла: беру или не беру, и почему. Убытки тоже. Открыт всем
              навсегда, с задержкой в 3 дня. У подписчиков решения приходят сразу.
            </p>
          </article>
          <article className="ns-panel p-6 md:p-7" style={{ borderColor: 'hsl(var(--accent) / 0.4)' }}>
            <h3 className="text-foreground">Проверь свою сделку</h3>
            <p className="mt-3 text-[15px] md:text-base leading-relaxed text-muted-foreground">
              Выберите пару и «покупка» или «продажа». Система сразу скажет, можно входить или нельзя, и почему.
              3 проверки в день.
            </p>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-md px-4 py-3" style={{ border: '1px solid var(--ns-line-strong)', background: 'rgba(6,10,18,0.6)' }}>
              <span className="font-mono text-sm text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>EURUSD · покупка</span>
              <span className="verdict verdict--no">нельзя</span>
            </div>
            <p className="mt-3 ns-cap">Пример ответа: «вы идёте против направления рынка по-крупному».</p>
          </article>
          <article className="ns-panel p-6 md:p-7">
            <h3 className="text-foreground">Сделки до и после</h3>
            <p className="mt-3 text-[15px] md:text-base leading-relaxed text-muted-foreground">
              Любое моё прошлое решение: график таким, каким он был в момент решения, и что было дальше.
            </p>
          </article>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" data-orbit="" onClick={() => trackClick('binocular_free_trial')}
            className="cta-trial btn-primary px-7 py-4 text-base self-start">
            7 дней бесплатно
          </a>
          <p className="ns-honest">Пробный доступ открывается в Telegram-боте после 4 коротких вопросов, если система вам подходит.</p>
        </div>
      </div>
    </section>
  );
}

// подписи к срокам — короткие, как в прототипе; цены и зачёркнутые цены берутся из ECOSYSTEM
const TIER_NOTE: Record<string, string> = {
  'первый месяц': 'Один раз на человека. Продлите на 3 месяца в течение этого месяца, и $199 засчитаются.',
  '3 месяца': '$149 в месяц.',
  '6 месяцев': '$140 в месяц вместо $149, экономия $54.',
  '12 месяцев': 'Около $124 в месяц вместо $149, экономия $298.',
};

export function SubscriptionPricesSection() {
  return (
    <section id="prices" className="section-animate relative py-14 md:py-20 ns-band">
      {/* лампа над ценами — тот же свет, что над «Сотрудничеством» прежней главной */}
      <div className="fx-lamp" data-fx="lamp" aria-hidden="true" />
      <div className="container-landing relative">
        <div className="max-w-3xl">
          <h2 className="text-foreground"><Words>Стоимость подписки</Words></h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Внутри во всех сроках одно и то же: программа, мой вердикт по каждой сделке, Hunter_Bot и Risk Sentinel, 2 урока и
            живой разбор с подписчиками по вторникам в Telegram.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM.map((e) => (
            <article
              key={e.period}
              data-beam={e.featured ? '' : undefined}
              className="p-6 rounded-md flex flex-col"
              style={
                e.featured
                  ? { border: '1px solid hsl(var(--accent) / 0.5)', background: 'radial-gradient(120% 80% at 50% 0%, hsl(var(--accent) / 0.1), var(--ns-panel) 62%)' }
                  : { border: '1px solid var(--v3-line)', background: 'var(--ns-panel)' }
              }
            >
              <div className="ns-kicker" style={{ textTransform: 'none' }}>{e.period[0].toUpperCase() + e.period.slice(1)}</div>
              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="ns-num text-[44px]">{e.price}</span>
                {e.oldPrice && <span className="text-base line-through text-muted-foreground/70">{e.oldPrice}</span>}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{TIER_NOTE[e.period] ?? e.tgNote}</p>
            </article>
          ))}
        </div>
        {/* 25.10.2026, Сергей: «две кнопки — на одну луч, на второй блик» */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('binocular_prices_buy')}
            className="btn-primary cta-shine px-7 py-4 text-base">
            Оформить подписку
          </a>
          <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" data-orbit="" style={{ '--od': '-1.2s' } as CSSProperties}
            onClick={() => trackClick('binocular_prices_trial')} className="btn-secondary px-7 py-4 text-base">
            Попробовать 7 дней
          </a>
        </div>
        <p className="mt-6 ns-honest" style={{ maxWidth: '78ch' }}>
          Помесячной подписки нет: после первого месяца 3, 6 или 12 месяцев. Возврата нет, подписка работает как аренда на
          срок, поэтому сначала 7 дней бесплатно. Торговли без убытков не бывает, и я её не обещаю. Зато риск каждой
          сделки известен до входа, а из 21 месяца в минус закрылись только 3.
        </p>
      </div>
    </section>
  );
}

export function StartAndFitSection() {
  return (
    <section id="fit" className="section-animate py-14 md:py-20">
      <div className="container-landing">
        <div className="flex flex-col md:flex-row gap-12 md:gap-16">
          <div className="md:flex-1">
            <h2 className="text-foreground"><Words>Что нужно для старта</Words></h2>
            <ul className="mt-7 space-y-4">
              {['MT4 или MT5 у любого брокера', 'Компьютер, который работает круглосуточно, чтобы роботы не спали', 'Депозит и риск на сделку выбираете вы. Я торгую с риском 0,25%'].map((t) => (
                <li key={t} className="flex gap-3 text-base md:text-[17px] text-foreground/90">{tick}<span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="md:flex-1">
            <h2 className="text-foreground"><Words>Кому бинокль не подойдёт</Words></h2>
            <ul className="mt-7 space-y-4">
              {[
                'Тому, кто хочет торговать внутри дня: сделки здесь держатся днями',
                'Тому, кто торгует меньше 3 месяцев',
                'Тому, кто пришёл с последними деньгами',
                'Тому, кто ищет торговлю без убыточных сделок: они бывают, иногда несколько подряд',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-base md:text-[17px] text-muted-foreground">
                  <span aria-hidden="true" className="flex-shrink-0 mt-[1px] text-muted-foreground/70">✕</span><span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export const BINOCULAR_FAQ = [
  { q: 'Можно ли совмещать с основной работой?', a: 'Да. Сделка живёт днями. Рынок смотрит программа, по каждой сделке приходит мой вердикт, сделку ведёт робот Hunter_Bot. От вас 2 действия: отметить место входа и нажать кнопку.' },
  { q: 'Это копирование сделок или управление моим счётом?', a: 'Нет. Деньги в управление я не принимаю, доступа к вашему счёту у меня нет. Я публикую решения, а место входа и кнопку выбираете вы. Дальше сделку ведёт робот Hunter_Bot на вашем счёте.' },
  { q: 'Можно начать с одного месяца?', a: 'Да. Первый месяц стоит $199, один раз на человека. Если в течение этого месяца продлите на 3 месяца, $199 засчитаются: доплата $248, а 3 месяца считаются с первого дня.' },
  { q: 'Нужно ли разбираться в программировании?', a: 'Нет. Роботы ставятся по пошаговой инструкции, а если застрянете, напишите мне. Достаточно базовых навыков работы с компьютером.' },
];
