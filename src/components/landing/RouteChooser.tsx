import { ArrowDown, ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import { nextStreamLabel } from '@/lib/practicum';

/**
 * Верхний этаж блока цен (08.10.2026): на /access наверху страницы, на лендинге в «12 · Сотрудничество».
 * Сергей переслал разбор GPT: «за 5–10 секунд человек должен понять, что ему выбрать», страница
 * двухэтажная: наверху простота и выбор, ниже доказательства и глубина. «На лендинге тоже поправь».
 *
 * По сути это навигация из оффера, раздел 8 («Что вам нужно»), с тремя правилами оттуда же:
 *   слоган «Никогда ещё трейдинг не был так прост» стоит только вместе с честной строкой;
 *   формула ECHO-GATE включает вердикт Сергея, без него остаётся «кнопка бабла»;
 *   слов «сигнал» и «триггер» нет: Сергей не сигнальщик.
 * Каждый маршрут ведёт к своей карточке ниже (id в PackageCards).
 *
 * ⚠️ showPrices=false (лендинг): цены только у курса и практикума. У подписки вместо цены
 * пробные 7 дней, у VIP «стоимость скажу лично» (оффер, раздел 2: цены подписки и VIP только на /access).
 */

const GOLD = 'hsl(var(--accent))';
const COOL = 'hsl(var(--cool))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant', serif", fontWeight: 500 };

type Route = {
  tag: string;
  need: string;
  product: string;
  price: string;
  per: string;
  publicPrice?: { price: string; per: string };
  note: string;
  anchor: string;
  tone: string;
  clickId: string;
};

const ROUTES: Route[] = [
  {
    tag: 'Путь 01',
    need: 'Хочу торговать по системе, не изучая её целиком',
    product: 'ECHO-GATE INSIDE',
    price: 'от $447',
    per: 'за 3 месяца',
    publicPrice: { price: '7 дней', per: 'бесплатно, при регистрации' },
    note: 'От вас 2 действия, остальное делает система',
    anchor: 'echo-gate',
    tone: GOLD,
    clickId: 'route_echo_gate',
  },
  {
    tag: 'Путь 02',
    need: 'Хочу понять систему сам',
    product: 'Trade System',
    price: '$349',
    per: '365 дней',
    note: 'Вся система, свой темп',
    anchor: 'trade-system',
    tone: COOL,
    clickId: 'route_trade_system',
  },
  {
    tag: 'Путь 02',
    need: 'Хочу понять систему с поддержкой',
    product: 'Практикум',
    price: '$499',
    per: '60 дней',
    note: 'Решения принимаем вместе',
    anchor: 'pkg-practicum',
    tone: COOL,
    clickId: 'route_practicum',
  },
  {
    tag: 'Всё сразу',
    need: 'Хочу всё и инструменты навсегда',
    product: 'VIP',
    price: '$2990',
    per: '365 дней + инструменты',
    publicPrice: { price: '', per: 'стоимость скажу лично' },
    note: 'Все пять этапов и ECHO-GATE INSIDE на год',
    anchor: 'pkg-trade_os_plus',
    tone: GOLD,
    clickId: 'route_vip',
  },
];

export default function RouteChooser({
  showPrices = true,
  heading = 'h1',
  kicker = 'TLT · Доступ · цены и условия',
  clickPrefix = 'access',
}: {
  showPrices?: boolean;
  heading?: 'h1' | 'h2';
  kicker?: string;
  clickPrefix?: string;
}) {
  const Title = heading;
  const stream = nextStreamLabel();
  const Sub = heading === 'h1' ? 'h2' : 'h3';
  return (
    <div>
      <span className="section-label" style={{ color: GOLD }}>{kicker}</span>
      <Title className="text-foreground" style={{ fontSize: 'clamp(36px, 5vw, 66px)', lineHeight: 1, maxWidth: '20ch' }}>
        Никогда ещё трейдинг <em>не был так прост</em>
      </Title>
      {/* честная строка обязательна рядом со слоганом (оффер, раздел 8) */}
      <p className="mt-4 text-sm md:text-base" style={{ color: 'hsl(var(--accent-dim))' }}>
        Торговли без убытков не бывает, и я её не обещаю. Зато риск каждой сделки известен до входа, а из 21 месяца
        в минус закрылись только 3.
      </p>
      <p className="mt-4 text-base text-muted-foreground" style={{ maxWidth: '64ch' }}>
        ECHO-GATE ищет и проверяет. Я даю вердикт. Вы выбираете точку входа и нажимаете кнопку. Дальше советник
        исполняет сделку по правилам.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <span className="text-mono" style={{ ...MONO, color: 'hsl(var(--muted-foreground))' }}>От вас 2 действия</span>
        {['Точка входа', 'Кнопка СТАРТ'].map((a, i) => (
          <span
            key={a}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-foreground"
            style={{ border: '1px solid hsl(var(--accent) / 0.45)', background: 'hsl(var(--accent) / 0.06)' }}
          >
            <span style={{ ...SERIF, fontSize: 20, lineHeight: 1, color: GOLD }}>{i + 1}</span>
            {a}
          </span>
        ))}
      </div>

      <Sub className="mt-10 md:mt-12 text-foreground" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)', lineHeight: 1.1 }}>
        Что вам <em>нужно?</em>
      </Sub>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROUTES.map((r) => {
          const shown = !showPrices && r.publicPrice ? r.publicPrice : { price: r.price, per: r.per };
          return (
            <a
              key={r.anchor}
              href={`#${r.anchor}`}
              onClick={() => trackClick(`${clickPrefix}_${r.clickId}`)}
              className="group flex flex-col p-5 md:p-6 transition-colors"
              style={{ background: 'hsl(var(--card))', border: `1px solid ${r.tone === GOLD ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))'}` }}
            >
              <span className="text-mono" style={{ ...MONO, color: r.tone }}>{r.tag}</span>
              <span className="mt-2 text-base text-foreground/90 leading-snug">{r.need}</span>
              <span className="mt-4 text-foreground" style={{ ...SERIF, fontSize: 22, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{r.product}</span>
              <span className="mt-1 text-sm text-muted-foreground leading-snug">
                {r.anchor === 'pkg-practicum' && stream ? `Старт ${stream}, решения принимаем вместе` : r.note}
              </span>
              <span className="flex-grow" />
              <span className="mt-5 flex items-baseline gap-2" style={{ minHeight: 34 }}>
                {shown.price && <span style={{ ...SERIF, fontSize: 34, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{shown.price}</span>}
                <span className="text-mono" style={{ ...MONO, letterSpacing: '0.12em', color: 'hsl(var(--muted-foreground))' }}>{shown.per}</span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-mono" style={{ ...MONO, color: r.tone }}>
                Подробнее <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              </span>
            </a>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Не знаете, что выбрать? Пришлите сделку: ВЕРДИКТ бесплатно, и я скажу, какой путь ваш ·{' '}
        <a
          href={TELEGRAM_LINKS.razbor}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(`${clickPrefix}_chooser_razbor`)}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors"
        >
          прислать сделку <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </p>
    </div>
  );
}
