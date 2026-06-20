import { ArrowRight, Check } from 'lucide-react';
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
  forWhom: string;
  points: string[];
  outcome: string;
  oldPrice: string;
  price: string;
  period: string;
  featured?: boolean;
};

const PACKAGES: Pkg[] = [
  {
    tag: '01 · Старт',
    name: 'Trade System',
    forWhom: 'Вы разочаровались в сигналах и хотите перестроить мышление.',
    points: [
      'Алгоритм принятия решений по шагам',
      'Чек-листы для входа в сделку',
      'Записи всех эфиров за прошлый год',
      'Самостоятельное изучение',
    ],
    outcome: 'Вы видите, что стоит за движением цены.',
    oldPrice: '$800',
    price: '$599',
    period: '90 дней',
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
      'HunterBot и Risk Sentinel — навсегда, остаются у вас',
    ],
    outcome: 'Система работает, решения за вами.',
    oldPrice: '$3499',
    price: '$2990',
    period: 'всё включено · 365 дней',
  },
];

const ECOSYSTEM = [
  { price: '$447', period: '3 месяца', desc: 'Echo Gate, HunterBot и Risk Sentinel в аренду. Попробовать инфраструктуру.', featured: false },
  { price: '$1490', period: '365 дней', desc: 'Echo Gate, HunterBot и Risk Sentinel в аренду на год.', featured: true },
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
      <div className="grid md:grid-cols-3 gap-3">
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
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed" style={{ minHeight: 44 }}>{p.forWhom}</p>

            <ul className="mt-5 space-y-2.5 flex-1">
              {p.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <Check size={15} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 text-sm italic" style={{ borderTop: '1px solid hsl(var(--rule-soft))', color: 'hsl(var(--accent-dim))' }}>
              {p.outcome}
            </div>

            {showPrices && (
              <>
                <div className="mt-5 flex items-baseline gap-3">
                  <span style={{ ...SERIF, fontSize: 38, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{p.price}</span>
                  <span className="text-sm line-through" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{p.oldPrice}</span>
                </div>
                <div className="text-mono mt-1" style={{ ...MONO, letterSpacing: '0.14em', color: 'hsl(var(--muted-foreground))' }}>{p.period}</div>
              </>
            )}

            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-all duration-300 group ${
                p.featured ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {p.featured ? 'Получить доступ' : 'Выбрать'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        ))}
      </div>

      {/* ecosystem subscription — graduates only */}
      <div className="mt-3 p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="text-mono" style={{ ...MONO, color: 'hsl(var(--cool))' }}>Подписка на экосистему · только выпускникам</div>
        <p className="mt-3 text-sm md:text-base text-muted-foreground" style={{ maxWidth: '70ch' }}>
          Доступ к инфраструктуре исполнения для выпускников: <b className="text-foreground/90">Echo-Gate</b> — сигнальный бот, <b className="text-foreground/90">HunterBot</b> — автоисполнение и сопровождение, <b className="text-foreground/90">Risk Sentinel</b> — защита капитала. Подписка — аренда на срок; решение всегда за вами.
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
              <p className="mt-1.5 text-xs text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
