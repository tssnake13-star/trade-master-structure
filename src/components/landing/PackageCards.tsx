import { ArrowRight, Check, X } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * PackageCards — shared package/pricing cards used on the homepage (without
 * prices) and on the hidden /access page (with prices). One design, prices
 * toggled via `showPrices`. All CTAs route to the Telegram bot (the funnel that
 * hands out the /access link to qualified leads).
 */
type Pkg = {
  tag: string;
  name: string;
  subtitle?: string;        // короткая строка под названием (напр. «Полностью самостоятельный»)
  forWhom: string;
  points: string[];         // что входит
  notIncluded?: string[];   // чего здесь нет (честно) — только у младшего тарифа
  upsell?: string;          // «переход выше»: зачёт цены в старший тариф
  outcome: string;
  oldPrice?: string;
  price: string;
  period: string;
  ctaText?: string;
  ctaHref?: string;           // персональная ссылка кнопки (переопределяет общую)
  showPriceAlways?: boolean;  // показывать цену даже когда showPrices=false (публичный вход)
  featured?: boolean;
};

const PACKAGES: Pkg[] = [
  {
    tag: '01 · Старт',
    name: 'Trade System',
    subtitle: 'Полностью самостоятельный',
    forWhom: 'Основной курс по стратегии школы в формате самостоятельного изучения. Весь путь вы проходите сами, в своём темпе, без моего участия.',
    points: [
      'Курс TRADE SYSTEM 2.0: 10 глав в личном кабинете',
      'PDF-протокол «Система допуска»',
      'Финальный зачёт и статус выпускника школы',
      'После зачёта — право подключить экосистему (Echo Gate, Hunter Bot, Risk Sentinel)',
    ],
    notIncluded: [
      'Моего сопровождения и разборов ваших сделок',
      'Обратной связи по домашним заданиям',
      'Личного чата со мной',
    ],
    upsell: 'Если в течение 30 дней после покупки вы решите перейти на годовой тариф TRADE OS с сопровождением, все $249 зачтутся в его стоимость.',
    outcome: 'Для тех, кто уже торговал, умеет работать самостоятельно и ищет систему, а не мотивацию со стороны.',
    price: '$249',
    period: '365 дней',
    ctaText: 'Начать самостоятельно',
    ctaHref: TELEGRAM_LINKS.dm,
    showPriceAlways: true,
  },
  {
    tag: '02 · Популярный',
    name: 'Trade OS',
    forWhom: 'Вы торгуете больше полугода и устали от хаоса.',
    points: [
      'Полная настройка вашей торговли',
      'Сценарии под разные фазы рынка',
      'Система сопровождения и выхода из сделки',
      'Закрытая дисциплинарная группа',
    ],
    outcome: 'Решения как у профессионала. Сделок меньше, потенциал выше.',
    oldPrice: '$1799',
    price: '$1599',
    period: '365 дней',
    featured: true,
  },
  {
    tag: '03 · Всё включено',
    name: 'Trade OS Plus',
    forWhom: 'Вам нужен полный доступ ко всей системе и базе.',
    points: [
      'Всё из Trade OS',
      'Индикаторы, скрипты и таблицы системы',
      'Hunter Bot и Risk Sentinel — навсегда, остаются у вас',
    ],
    outcome: 'Система работает, решения за вами.',
    oldPrice: '$3499',
    price: '$2990',
    period: '365 дней + роботы',
  },
];

const ECOSYSTEM: { price: string; period: string; desc: string; gift?: string; featured: boolean }[] = [
  { price: '$447', period: '3 месяца', desc: 'Echo Gate, Hunter Bot и Risk Sentinel в аренду. Попробовать инфраструктуру.', featured: false },
  { price: '$1490', period: '365 дней', desc: 'Echo Gate, Hunter Bot и Risk Sentinel в аренду на год', gift: '+ 2 месяца в подарок', featured: true },
];

const GOLD = 'hsl(var(--accent))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant', serif", fontWeight: 500 };

export default function PackageCards({
  showPrices,
  ctaHref = TELEGRAM_LINKS.bot,
}: { showPrices: boolean; ctaHref?: string }) {
  return (
    <>
      {/* three levels */}
      <div className="grid md:grid-cols-3 gap-3 items-start">
        {PACKAGES.map((p) => (
          <div
            key={p.name}
            className="relative flex flex-col p-6 md:p-7"
            style={{
              background: p.featured
                ? 'radial-gradient(120% 80% at 50% 0%, hsl(var(--accent) / 0.08), hsl(var(--card)) 60%)'
                : 'hsl(var(--card))',
              border: `1px solid ${p.featured ? 'hsl(var(--accent) / 0.45)' : 'hsl(var(--border))'}`,
            }}
          >
            <div className="text-mono" style={{ ...MONO, color: GOLD }}>{p.tag}</div>
            <h3 className="mt-2 text-foreground" style={{ fontSize: 28, lineHeight: 1.05 }}>{p.name}</h3>
            {p.subtitle && (
              <div className="text-mono mt-1.5" style={{ ...MONO, letterSpacing: '0.16em', color: 'hsl(var(--muted-foreground))' }}>{p.subtitle}</div>
            )}
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed" style={{ minHeight: 44 }}>{p.forWhom}</p>

            {/* что входит */}
            <ul className="mt-5 space-y-2.5">
              {p.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <Check size={15} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            {/* чего здесь нет — честно */}
            {p.notIncluded && (
              <div className="mt-5">
                <div className="text-mono mb-2.5" style={{ ...MONO, color: 'hsl(var(--muted-foreground) / 0.7)' }}>Чего здесь нет</div>
                <ul className="space-y-2.5">
                  {p.notIncluded.map((nt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground/70">
                      <X size={15} style={{ marginTop: 2, flexShrink: 0, opacity: 0.5 }} />
                      <span>{nt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* переход выше — зачёт цены в старший тариф */}
            {p.upsell && (
              <div className="mt-5 p-3.5 text-xs leading-relaxed" style={{ border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)', color: 'hsl(var(--foreground) / 0.85)' }}>
                <span className="text-mono" style={{ ...MONO, color: GOLD, display: 'block', marginBottom: 6 }}>Переход выше</span>
                {p.upsell}
              </div>
            )}

            <div className="mt-5 pt-4 text-sm italic" style={{ borderTop: '1px solid hsl(var(--rule-soft))', color: 'hsl(var(--accent-dim))' }}>
              {p.outcome}
            </div>

            {(showPrices || p.showPriceAlways) ? (
              <>
                <div className="mt-5 flex items-baseline gap-3">
                  <span style={{ ...SERIF, fontSize: 38, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{p.price}</span>
                  {p.oldPrice && <span className="text-sm line-through" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{p.oldPrice}</span>}
                </div>
                <div className="text-mono mt-1" style={{ ...MONO, letterSpacing: '0.14em', color: 'hsl(var(--muted-foreground))' }}>{p.period}</div>
              </>
            ) : (
              <div
                className="text-mono mt-5 inline-flex items-center self-start px-3 py-1.5"
                style={{ ...MONO, letterSpacing: '0.14em', color: GOLD, border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)' }}
              >
                {p.period}
              </div>
            )}

            <a
              href={p.ctaHref ?? ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-all duration-300 group ${
                p.featured ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {p.ctaText ?? (p.featured ? 'Получить доступ' : 'Выбрать')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        ))}
      </div>

      {/* ecosystem subscription — graduates only */}
      <div className="mt-3 p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="text-mono" style={{ ...MONO, color: 'hsl(var(--cool))' }}>Подписка на экосистему · только выпускникам</div>
        <p className="mt-3 text-sm md:text-base text-muted-foreground" style={{ maxWidth: '70ch' }}>
          Доступ к инфраструктуре исполнения для выпускников: <b className="text-foreground/90">Echo Gate</b> — сигнальный бот, <b className="text-foreground/90">Hunter Bot</b> — автоисполнение и сопровождение, <b className="text-foreground/90">Risk Sentinel</b> — защита капитала. Подписка — аренда на срок; решение всегда за вами.
        </p>
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          {ECOSYSTEM.map((e) => (
            <div key={e.period} className="p-4" style={{ border: `1px solid ${e.featured ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--rule-soft))'}` }}>
              <div className="flex items-baseline gap-2">
                {showPrices && <span style={{ ...SERIF, fontSize: 26, color: 'hsl(var(--foreground))' }}>{e.price}</span>}
                <span className="text-mono" style={{ ...MONO, fontSize: showPrices ? 10 : 13, letterSpacing: '0.12em', color: showPrices ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' }}>
                  {showPrices ? `/ ${e.period}` : e.period}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {e.desc}{e.gift && <> <b className="text-foreground/90">{e.gift}</b>.</>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
