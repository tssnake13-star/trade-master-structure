import { ArrowDown, ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import { nextStreamLabel } from '@/lib/practicum';
import { STUDY_PRICES } from '@/lib/prices';
import Words from '@/components/fx/Words';
import { v2 } from '@/lib/lookV2';

/**
 * Верхний этаж блока цен (08.10.2026): на /access наверху страницы, на лендинге в «12 · Сотрудничество».
 * Сергей переслал разбор GPT: «за 5–10 секунд человек должен понять, что ему выбрать», страница
 * двухэтажная: наверху простота и выбор, ниже доказательства и глубина. «На лендинге тоже поправь».
 *
 * 11.10.2026: два пути вместо четырёх плиток. Сергей: «человек приходит, и у него сразу перед глазами
 * два пути». Пути не равные: подписка крупно и с кнопкой «Попробовать 7 дней» (через бота, чтобы человек
 * остался в базе), обучение рядом и тише, внутри курс, практикум и VIP. Две плитки «Путь 02» подряд
 * путали выбор.
 *
 * Правила из оффера, раздел 8:
 *   слоган «Никогда ещё трейдинг не был так прост» стоит только вместе с честной строкой;
 *   формула ECHO-GATE включает вердикт Сергея, без него остаётся «кнопка бабла»;
 *   слов «сигнал» и «триггер» нет: Сергей не сигнальщик.
 * Каждый путь и каждая ступень обучения ведут к своей карточке ниже (id в PackageCards).
 *
 * ⚠️ showPrices=false (лендинг): у подписки здесь пробные 7 дней (цены подписки на её карточке ниже),
 * у VIP «стоимость скажу лично» (Сергей 20.10.2026: «хотя бы VIP убери»). Цены из lib/prices.ts.
 */

const GOLD = 'hsl(var(--accent))';
const COOL = 'hsl(var(--cool))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant', serif", fontWeight: 500 };

// Что получает подписчик: вердикт сразу — главная разница с пробным доступом, где журнал идёт с задержкой в 3 дня
const ECHO_POINTS = [
  'Терминал находит сделку, мой вердикт приходит сразу: в терминал и в Telegram',
  'От вас 2 действия: точка входа и кнопка СТАРТ',
  'Сделку ведёт советник, лимиты держит Risk Sentinel',
];

type Study = {
  product: string;
  who: string;
  price: string;
  per: string;
  publicPrice?: { price: string; per: string };
  anchor: string;
  clickId: string;
};

const STUDY: Study[] = [
  { product: 'Trade System', who: 'сам, в своём темпе', price: STUDY_PRICES.tradeSystem.price, per: STUDY_PRICES.tradeSystem.period, anchor: 'trade-system', clickId: 'route_trade_system' },
  { product: 'Практикум', who: 'вместе со мной, решения принимаем вместе', price: STUDY_PRICES.practicum.price, per: STUDY_PRICES.practicum.period, anchor: 'pkg-practicum', clickId: 'route_practicum' },
  {
    product: 'VIP',
    who: 'всё сразу и инструменты навсегда',
    price: STUDY_PRICES.vip.price,
    per: '365 дней',
    publicPrice: { price: '', per: 'стоимость скажу лично' },
    anchor: 'pkg-trade_os_plus',
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
  // 20.10.2026: подписку можно начать с первого месяца за $199 (решение Сергея), с зачётом в 3 месяца
  const echoPrice = showPrices ? { price: 'от $199', per: 'первый месяц' } : { price: '7 дней', per: 'бесплатно, после 4 вопросов' };
  return (
    <div>
      <span className="section-label" style={{ color: GOLD }}>{kicker}</span>
      <Title className="text-foreground" style={{ fontSize: 'clamp(36px, 5vw, 66px)', lineHeight: 1, maxWidth: '20ch' }}>
        <Words>Никогда ещё трейдинг <em>не был так прост</em></Words>
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
      {/* 11.10.2026: снимаем вопрос «это копирование или управление?» до того, как его зададут */}
      <p className="mt-2 text-sm text-muted-foreground" style={{ maxWidth: '64ch' }}>
        Это не копирование сделок и не управление вашим счётом: счёт ваш, кнопку нажимаете вы.
      </p>

      <Sub className="mt-10 md:mt-12 text-foreground" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)', lineHeight: 1.1 }}>
        Что вам <em>нужно?</em>
      </Sub>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        {/* Путь 01 — подписка, главный: крупно, с кнопкой */}
        <div
          className="flex flex-col p-6 md:p-8"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--accent) / 0.45)' }}
        >
          <span className="text-mono" style={{ ...MONO, color: GOLD }}>{v2('Путь 01', 'Путь 1')}</span>
          <span className="mt-2 text-lg text-foreground leading-snug">Хочу торговать по системе, не изучая её целиком</span>
          <span className="mt-4 text-foreground" style={{ ...SERIF, fontSize: 30, lineHeight: 1.05 }}>ECHO-GATE INSIDE</span>
          <ul className="mt-4 grid gap-2">
            {ECHO_POINTS.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm md:text-base text-muted-foreground leading-snug">
                <span style={{ color: GOLD }}>·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <span className="flex-grow" />
          <span className="mt-6 flex items-baseline gap-2">
            <span style={{ ...SERIF, fontSize: 38, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{echoPrice.price}</span>
            <span className="text-mono" style={{ ...MONO, letterSpacing: '0.12em', color: 'hsl(var(--muted-foreground))' }}>{echoPrice.per}</span>
          </span>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={TELEGRAM_LINKS.trial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(`${clickPrefix}_route_trial`)}
              className="btn-primary group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium"
            >
              Попробовать 7 дней
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#echo-gate"
              onClick={() => trackClick(`${clickPrefix}_route_echo_gate`)}
              className="group inline-flex items-center gap-1.5 text-mono"
              style={{ ...MONO, color: GOLD }}
            >
              Подробнее <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Путь 02 — обучение: тише, три ступени внутри */}
        <div className="flex flex-col p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <span className="text-mono" style={{ ...MONO, color: COOL }}>{v2('Путь 02', 'Путь 2')}</span>
          <span className="mt-2 text-base text-foreground/90 leading-snug">Хочу изучить систему и решать сам</span>
          <span className="mt-4 text-foreground" style={{ ...SERIF, fontSize: 24, lineHeight: 1.05 }}>Обучение</span>
          <div className="mt-4 grid">
            {STUDY.map((s) => {
              const shown = !showPrices && s.publicPrice ? s.publicPrice : { price: s.price, per: s.per };
              const who = s.anchor === 'pkg-practicum' && stream ? `со мной, старт ${stream}` : s.who;
              return (
                <a
                  key={s.anchor}
                  href={`#${s.anchor}`}
                  onClick={() => trackClick(`${clickPrefix}_${s.clickId}`)}
                  className="group flex items-baseline justify-between gap-4 py-3"
                  style={{ borderTop: '1px solid hsl(var(--border))' }}
                >
                  <span className="min-w-0">
                    <span className="block text-foreground" style={{ ...SERIF, fontSize: 19, lineHeight: 1.1 }}>{s.product}</span>
                    <span className="block mt-0.5 text-xs md:text-sm text-muted-foreground leading-snug">{who}</span>
                  </span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {shown.price && <span style={{ ...SERIF, fontSize: 22, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{shown.price}</span>}
                    <span className="text-mono" style={{ ...MONO, letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>{shown.per}</span>
                    <ArrowDown className="w-3.5 h-3.5 self-center group-hover:translate-y-0.5 transition-transform" style={{ color: COOL }} />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Не знаете, что выбрать? Пришлите сделку: ВЕРДИКТ бесплатно, и я скажу, какой путь ваш{v2(' ·', '.')}{' '}
        <a
          href={TELEGRAM_LINKS.razbor}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(`${clickPrefix}_chooser_razbor`)}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors"
        >
          {v2('прислать сделку', 'Прислать сделку')} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </p>
    </div>
  );
}
