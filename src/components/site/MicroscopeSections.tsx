import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import { STUDY_PRICES } from '@/lib/prices';
import { nextStreamLabel } from '@/lib/practicum';
import Words from '@/components/fx/Words';
import SchoolMapVideo from '@/components/landing/SchoolMapVideo';

/*
 * Разделы страницы «Микроскоп» (28.10.2026, прототип «Ночной кабинет»). VIP без цены: «скажу лично»
 * (Сергей 20.10.2026, подтвердил 28.10.2026: «оставить как есть сейчас»). Дата потока — lib/practicum.ts.
 */

/** Стоимость в первом экране: три строки на стекле. */
export function StudyPriceCard() {
  const stream = nextStreamLabel();
  const rows = [
    { name: 'Trade System', sub: 'сами, в своём темпе', price: STUDY_PRICES.tradeSystem.price },
    { name: 'Практикум', sub: stream ? `60 дней со мной, старт ${stream}` : '60 дней со мной', price: STUDY_PRICES.practicum.price },
    { name: 'VIP', sub: 'все 5 этапов и инструменты навсегда', price: null },
  ];
  return (
    <div className="ns-glass ns-rise p-2 md:p-3">
      {rows.map((r, i) => (
        <div key={r.name} className={`flex items-center justify-between gap-4 px-4 md:px-5 py-5 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--v3-line)' }}>
          <div className="min-w-0">
            <div className="text-lg md:text-xl font-semibold text-foreground">{r.name}</div>
            <div className="ns-cap mt-1">{r.sub}</div>
          </div>
          {r.price ? <div className="ns-num text-[34px] md:text-[40px]">{r.price}</div> : <div className="ns-cap text-right" style={{ maxWidth: '12ch' }}>стоимость скажу лично</div>}
        </div>
      ))}
    </div>
  );
}

const STAGES = [
  { title: 'Теория', text: 'Глава за главой, с домашним заданием, которое я проверяю сам. Со мной база собрана плотнее, в 8 блоков: на блок сутки, при необходимости двое.' },
  { title: 'Тренировки по готовым сделкам', text: 'Даю готовую сделку. Вы повторяете её и понимаете, почему она вообще существует. Около 5 сделок, и здесь ломается привычка угадывать.' },
  { title: 'Только дата', text: 'Даю дату: без направления, без снимков, без подсказок. Сделку вы делаете сами, столько раз, сколько нужно, чтобы я увидел, что вы понимаете, что делаете.' },
  { title: 'Самостоятельный поиск', text: 'Вы сами ищете ситуации и разбираете их. Минимум 50 тренировок перед реальным рынком. Самый длинный этап, и на нём становится видно всё.' },
  { title: 'Реальный рынок', text: 'Каждую неделю полный обзор по основным парам. Тренировки идут параллельно, и рынок вы читаете уже своим опытом, а не чужим объяснением.' },
];

// сколько из 5 этапов проходится на ступени: 1 — этап целиком, 0.5 — начат
const REACH: { name: string; segs: number[]; text: string }[] = [
  { name: 'Trade System', segs: [0, 0, 0, 0, 0], text: 'Этапов нет: вы получаете систему и проходите её сами' },
  { name: 'Практикум', segs: [1, 1, 1, 0.5, 0], text: 'Реалистично до четвёртого, и я говорю об этом сразу' },
  { name: 'VIP', segs: [1, 1, 1, 1, 1], text: 'Все пять этапов до выхода на реальный рынок' },
];

export function StagesSection() {
  return (
    <section id="stages" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground"><Words>5 этапов до реального рынка</Words></h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Путь одинаковый для всех, кто учится со мной. Разница между видеообучением, практикумом и VIP в том, докуда вы по
            нему доходите.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((s, i) => (
            <div key={s.title} className="ns-panel p-5 md:p-6">
              <div className="ns-num text-[40px]" style={{ color: 'var(--v3-gold)' }}>{i + 1}</div>
              <h3 className="mt-4 text-foreground !text-[20px]">{s.title}</h3>
              <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-14 text-foreground">Докуда вы доходите</h3>
        <div className="mt-6 grid gap-4">
          {REACH.map((r) => (
            <div key={r.name} className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
              <div className="w-40 flex-shrink-0 text-lg font-semibold text-foreground">{r.name}</div>
              <div className="ns-segs flex-[1_1_320px]" aria-label={`${r.name}: ${r.text}`}>
                {r.segs.map((v, k) => (
                  <span key={k} data-on={v ? '' : undefined} data-half={v === 0.5 ? '' : undefined} style={{ '--k': k } as CSSProperties}><i /></span>
                ))}
              </div>
              <div className="flex-[1_1_260px] text-base text-muted-foreground">{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const tick = <Check size={15} className="flex-shrink-0 mt-[3px]" style={{ color: 'var(--v3-gold)' }} aria-hidden="true" />;

export function StudyLevelsSection() {
  const stream = nextStreamLabel();
  const levels = [
    {
      id: 'trade_system',
      tag: 'самостоятельно',
      name: 'Trade System',
      price: STUDY_PRICES.tradeSystem.price,
      period: STUDY_PRICES.tradeSystem.period,
      points: ['Видеообучение TRADE SYSTEM 2.0: 10 глав в личном кабинете', 'Полный алгоритм системы в PDF', 'Финальный зачёт и статус выпускника', 'Без этапов, без моего участия и без прямых эфиров'],
      note: 'Возврата здесь нет: система открывается целиком в первый же день.',
      cta: 'Начать самостоятельно',
    },
    {
      id: 'practicum',
      tag: 'вместе со мной',
      name: 'Практикум',
      price: STUDY_PRICES.practicum.price,
      period: STUDY_PRICES.practicum.period,
      points: ['Всё из Trade System', 'Прямой эфир раз в неделю. После практикума доступ к эфирам остаётся, если берёте подписку', 'Еженедельный разбор сделок группы в записи', 'Личный разбор ваших сделок и обратная связь по каждому решению', 'Закрытая группа'],
      note: stream ? `Ближайший поток стартует ${stream}. Беру не всех: поток идёт от 3 человек.` : 'Беру не всех: поток идёт от 3 человек.',
      cta: 'Узнать про ближайший поток',
      featured: true,
    },
    {
      id: 'vip',
      tag: 'всё сразу',
      name: 'VIP',
      price: null,
      period: '365 дней и инструменты',
      points: ['Все пять этапов обучения и год сопровождения', 'ECHO-GATE INSIDE на год', 'Индикаторы, скрипты и таблицы системы', 'Hunter_Bot и Risk Sentinel остаются у вас навсегда'],
      note: 'Все продажи окончательные: инструменты привязываются к номеру вашего торгового счёта и остаются у вас.',
      cta: 'Получить полный доступ',
    },
  ];
  return (
    <section id="levels" className="section-animate relative py-14 md:py-20">
      <div className="fx-lamp" data-fx="lamp" aria-hidden="true" />
      <div className="container-landing relative">
        <div className="max-w-3xl">
          <h2 className="text-foreground"><Words>Три ступени</Words></h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Видеообучение и практикум — разные ступени, а не версии одного продукта. Из видеообучения в практикум доплатой не перейти,
            выбирайте сразу. После любого обучения подписка ECHO-GATE INSIDE подключается сразу.
          </p>
        </div>
        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          {levels.map((l, i) => (
            <article
              key={l.id}
              id={`pkg-${l.id}`}
              data-beam={l.featured ? '' : undefined}
              className="p-6 md:p-7 rounded-md flex flex-col"
              style={
                l.featured
                  ? { border: '1px solid hsl(var(--accent) / 0.5)', background: 'radial-gradient(120% 80% at 50% 0%, hsl(var(--accent) / 0.1), var(--ns-panel) 62%)' }
                  : { border: '1px solid var(--v3-line)', background: 'var(--ns-panel)' }
              }
            >
              {/* 29.10.2026: подпись над названием убрана, «самостоятельно / вместе со мной / всё сразу» стоит в строке срока */}
              <h3 className="text-foreground !text-[28px] !font-bold" style={{ letterSpacing: '-0.03em' }}>{l.name}</h3>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {l.price ? <span className="ns-num text-[40px]">{l.price}</span> : <span className="text-xl font-semibold text-foreground">Стоимость скажу лично</span>}
                <span className="ns-cap">{l.period}, {l.tag}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {l.points.map((pt) => <li key={pt} className="flex gap-2.5 text-base text-foreground/90">{tick}<span>{pt}</span></li>)}
              </ul>
              <div className="flex-grow" />
              <p className="mt-6 pt-4 border-t border-border text-sm leading-relaxed text-muted-foreground">{l.note}</p>
              {/* 25.10.2026, Сергей: «две кнопки рядом — на одну луч, на второй блик»: у практикума блик, у соседей луч */}
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(`package_${l.id}`)}
                data-orbit={l.featured ? undefined : ''}
                style={l.featured ? ({ '--shd': '1.6s' } as CSSProperties) : ({ '--od': `${-1.1 - i * 1.1}s` } as CSSProperties)}
                className={`mt-5 justify-center px-6 py-3.5 text-base ${l.featured ? 'btn-primary cta-shine' : 'btn-secondary'}`}
              >
                {l.cta}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-3 ns-panel p-6 md:p-7">
          <h3 className="text-foreground !text-[20px]">Как устроен выбор</h3>
          <ul className="mt-4 space-y-2.5 text-base leading-relaxed text-foreground/85 list-disc pl-5 marker:text-muted-foreground">
            <li>В VIP оплаченное засчитывается полностью: 30 дней после видеообучения, 67 дней после практикума.</li>
            <li>Прямые эфиры есть в практикуме и после него остаются с подпиской. В Trade System их нет.</li>
            <li>
              Хотите торговать по системе, не изучая её? Это{' '}
              <Link to="/binocular" className="text-foreground underline underline-offset-4 decoration-[hsl(var(--accent))]">бинокль</Link>.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function FirstBlockSection() {
  return (
    <section id="rule" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 lg:items-start">
          <div className="lg:flex-1">
            <h2 className="text-foreground"><Words>Правило первого блока</Words></h2>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/90" style={{ maxWidth: '52ch' }}>
              На практикуме первый блок вводный. Пройдите его целиком и решите. Не ваше — возвращаю деньги полностью, объяснять ничего не
              нужно. Открыли второй блок, значит решение принято, и дальше мы идём до конца.
            </p>
          </div>
          <div className="lg:flex-1 ns-glass p-7 md:p-8">
            <h3 className="text-foreground !text-[20px]">Одно условие до оплаты</h3>
            <p className="mt-3 text-base leading-relaxed text-foreground/90">
              Весь срок обучения работаем строго по моему алгоритму, без своих добавлений. Если хотите собрать свою систему,
              я вам не помощник.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              И честно: за 2 месяца практикума до реального рынка обычно не доходят. Реалистично вы доходите до четвёртого
              этапа.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SchoolMapSection() {
  return (
    <section id="map" className="section-animate py-14 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-foreground"><Words>Карта школы</Words></h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">Оба пути от двери до реального рынка за 4,5 минуты.</p>
        </div>
        <div className="mt-10">
          <SchoolMapVideo showCaption={false} />
        </div>
      </div>
    </section>
  );
}

export const MICROSCOPE_FAQ = [
  { q: 'Можно ли совмещать с основной работой?', a: 'Да. Раз в неделю, на выходных, 30–60 минут на разбор рынка и выбор пар, а в течение недели короткая проверка каждые 4 часа.' },
  { q: 'Можно ли вернуть деньги?', a: 'На практикуме действует правило первого блока: не ваше — верну деньги полностью. В видеообучении возврата нет: система открывается целиком в первый же день. В VIP все продажи окончательные.' },
  { q: 'А если у меня не получится?', a: 'Если правила соблюдать вы не готовы, не получится ни на обучении, ни на подписке. Поэтому на обучение я беру не всех и до оплаты задаю вопросы.' },
  { q: 'Что в VIP есть такого, чего нет в подписке?', a: 'Обучение: все 5 этапов со мной за год, до реального рынка. Плюс ECHO-GATE INSIDE на год, индикаторы, скрипты и таблицы системы. Hunter_Bot, робот-исполнитель, и Risk Sentinel, страж счёта, остаются у вас навсегда.' },
];
