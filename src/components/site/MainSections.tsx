import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import { STUDY_PRICES } from '@/lib/prices';
import Words from '@/components/fx/Words';

/*
 * Разделы главной (28.10.2026, прототип «Ночной кабинет», утверждён Сергеем: «Переноси на настоящий сайт»).
 * Главная — развилка: каждый раздел коротко и ведёт на свою страницу, подробности там.
 * Анимация общая (useLandingFx): заголовок по словам, текст снизу, ряды .grid по очереди, лучи на [data-beam].
 */

const PAINS = [
  { q: 'То плюс, то минус', a: 'Каждое решение принимается по одним и тем же правилам. Программа проверяет рынок одинаково каждый день, а не заново под настроение.' },
  { q: 'Знания есть, а решения хаотичные', a: 'Решение принято до входа: про каждую сделку я говорю «беру» или «не беру», и почему.' },
  { q: 'Вхожу, потом сомневаюсь и выхожу', a: 'После кнопки сделку ведёт Hunter_Bot, робот-исполнитель: сам ставит защиту и сам переводит сделку в ноль.' },
  { q: 'Нет времени сидеть у графика', a: 'Рынок смотрит программа, в сделку входит робот. От вас нужно отметить место входа и нажать кнопку.' },
  { q: 'Одна сделка забрала много', a: 'Risk Sentinel, страж счёта: риск каждой сделки известен до входа, а плохую неделю он останавливает сам.' },
];

export function PainsSection() {
  return (
    <section id="pains" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        {/* раскладка флексом, а не .grid: у .grid хореография проявляет детей карточками, и заголовок проявлялся бы дважды */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <div className="lg:w-[38%] flex-shrink-0">
            <h2 className="text-foreground"><Words>Чаще всего мне пишут так</Words></h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '40ch' }}>
              Знаний у этих людей хватает. Не хватает правил, по которым решение принимается до входа, а не в момент,
              когда страшно.
            </p>
          </div>
          <div className="grid flex-1 min-w-0 border-t border-border">
            {PAINS.map((p) => (
              <div key={p.q} className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] gap-x-8 gap-y-2 py-6 border-b border-border">
                <div className="text-lg md:text-xl font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>«{p.q}»</div>
                <p className="text-base md:text-lg leading-relaxed text-muted-foreground">{p.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { who: 'программа', text: 'Каждый день проверяет все валютные пары и оставляет те, где рынок идёт в одну сторону и по-крупному, и по-мелкому.' },
  { who: 'я', text: 'Из этих пар я выбираю сделки и про каждую говорю «беру» или «не беру», и почему.' },
  { who: 'вы', text: 'Вы отмечаете место, где войти, и нажимаете кнопку. Больше от вас ничего не нужно.', you: true },
  { who: 'Hunter_Bot и Risk Sentinel', text: 'Hunter_Bot, робот-исполнитель, сам входит, ставит защиту и переводит сделку в ноль. Risk Sentinel, страж счёта, останавливает торговлю, если неделя пошла плохо.' },
];

export function StepsSection() {
  return (
    <section id="how" className="section-animate py-14 md:py-20">
      <div className="container-landing">
        <h2 className="text-foreground"><Words>Как это работает</Words></h2>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">Четыре шага. Три из них делаете не вы.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.who}
              className="ns-panel p-6 flex flex-col"
              style={s.you ? { borderColor: 'hsl(var(--accent) / 0.55)', background: 'linear-gradient(180deg, hsl(var(--accent) / 0.08), var(--ns-panel) 70%)' } : undefined}
            >
              <div className="flex items-baseline gap-3">
                <span className="ns-num text-[40px]">{i + 1}</span>
                <span className="ns-step-n">{s.who}</span>
              </div>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link to="/binocular" data-orbit="" onClick={() => trackClick('main_how_binocular')} className="btn-secondary px-6 py-3.5 text-base">
            Как работает бинокль, подробно
          </Link>
        </div>
      </div>
    </section>
  );
}

const NUMBERS = [
  { n: '387', l: 'сделок за 21 месяц, каждая записана в дневник' },
  { n: '+9,5R', l: 'средняя прибыльная сделка при стопе в 1R' },
  { n: '23,5%', l: 'прибыльных, примерно 1 из 4. Прибыльная в среднем в 9,5 раза больше убыточной' },
  { n: '3 из 21', l: 'месяц закрылся в минус' },
];

/** Цифры счёта (главная и «Об авторе»). id="stats": по цифрам один раз проходит блик (useLandingFx). */
export function NumbersSection({ title, lede, caption }: { title: string; lede?: ReactNode; caption: ReactNode }) {
  return (
    <section id="stats" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row lg:items-end gap-x-16 gap-y-5">
          <h2 className="text-foreground lg:w-1/2 flex-shrink-0"><Words>{title}</Words></h2>
          {lede && <p className="text-base md:text-lg text-muted-foreground" style={{ maxWidth: '46ch' }}>{lede}</p>}
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {NUMBERS.map((s) => (
            <div key={s.n} className="ns-panel p-5 md:p-6">
              <div className="ns-num tabular-nums text-[34px] sm:text-[44px] md:text-[56px]">{s.n}</div>
              <div className="ns-cap mt-3">{s.l}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 pt-5 border-t border-border ns-cap">{caption}</p>
      </div>
    </section>
  );
}

export function PathsSection() {
  return (
    <section id="paths" className="section-animate py-14 md:py-20">
      <div className="container-landing">
        <h2 className="text-foreground"><Words>Два пути. Один алгоритм.</Words></h2>
        <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '52ch' }}>
          Микроскоп учит видеть рынок самому, бинокль показывает, что вижу я.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <article
            data-beam=""
            className="p-7 md:p-9 flex flex-col rounded-md"
            style={{ border: '1px solid hsl(var(--accent) / 0.45)', background: 'radial-gradient(120% 80% at 50% 0%, hsl(var(--accent) / 0.09), var(--ns-panel) 62%)' }}
          >
            {/* 29.10.2026: подпись над заголовком («подписка ECHO-GATE INSIDE») убрана, она стала первыми словами текста */}
            <h3 className="text-foreground !text-[40px] !font-bold" style={{ letterSpacing: '-0.035em', lineHeight: 1 }}>Бинокль</h3>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/90">
              Подписка ECHO-GATE INSIDE. Торговать по моей системе, не изучая её: программа и мой вердикт по каждой
              сделке, а от вас 2 действия, отметить место входа и нажать кнопку.
            </p>
            <div className="flex-grow min-h-6" />
            <div className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="ns-num text-[40px]">$199</span>
              <span className="ns-cap">первый месяц, дальше 3, 6 или 12 месяцев</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" data-orbit="" style={{ '--od': '-1.4s' } as CSSProperties}
                onClick={() => trackClick('main_paths_trial')} className="cta-trial btn-primary px-6 py-3.5 text-base">
                7 дней бесплатно
              </a>
              <Link to="/binocular" onClick={() => trackClick('main_paths_binocular')} className="btn-secondary px-6 py-3.5 text-base">
                <span className="cta-shine-text">Подробнее о бинокле</span>
              </Link>
            </div>
          </article>

          <article className="ns-panel p-7 md:p-9 flex flex-col">
            <h3 className="text-foreground !text-[40px] !font-bold" style={{ letterSpacing: '-0.035em', lineHeight: 1 }}>Микроскоп</h3>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/90">
              Обучение. Изучить систему и решать самому: почему цена идёт туда, куда идёт, и где в неё входить.
            </p>
            <div className="flex-grow min-h-6" />
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
              <span className="text-foreground">Видеообучение <b className="ns-num text-[28px] ml-1">{STUDY_PRICES.tradeSystem.price}</b></span>
              <span className="text-foreground">Практикум <b className="ns-num text-[28px] ml-1">{STUDY_PRICES.practicum.price}</b></span>
              <span className="ns-cap">VIP, стоимость скажу лично</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/microscope" data-orbit="" style={{ '--od': '-3s' } as CSSProperties} onClick={() => trackClick('main_paths_microscope')}
                className="btn-secondary px-6 py-3.5 text-base">
                Подробнее об обучении
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function AuthorTeaser() {
  return (
    <section id="author" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 md:items-center">
          <div className="md:w-[40%] flex-shrink-0 overflow-hidden rounded-md" style={{ border: '1px solid var(--v3-line)' }}>
            <img src="/author-sergey-te.jpg" alt="Сергей Тё" width={800} height={800} loading="lazy" className="w-full h-auto block" />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground"><Words>Сергей Тё</Words></h2>
            <p className="mt-5 text-lg md:text-xl text-foreground" style={{ maxWidth: '40ch' }}>
              15 лет в рынке. Торгую по той же системе, которую даю вам попробовать.
            </p>
            <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground" style={{ maxWidth: '54ch' }}>
              Первые 3 года я только терял, ещё 2 года был около нуля. Потом пришёл учиться к опытному трейдеру и начал
              делать то, что он говорит. Сегодня у меня своя система: 387 сделок за 21 месяц, и каждое решение записано в дневник до
              движения цены.
            </p>
            <blockquote className="mt-8 text-[22px] md:text-[28px] font-medium leading-snug text-foreground" style={{ letterSpacing: '-0.02em', maxWidth: '30ch' }}>
              «<span className="cta-shine-text">Мои лучшие сделки — те, которые я не совершил</span>»
            </blockquote>
            <div className="mt-9">
              <Link to="/author" data-orbit="" style={{ '--od': '-2.2s' } as CSSProperties} onClick={() => trackClick('main_author')}
                className="btn-secondary px-6 py-3.5 text-base">
                Подробнее об авторе
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
