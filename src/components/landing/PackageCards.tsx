import { ArrowRight, Check, X } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';

/**
 * PackageCards — shared package/pricing cards used on the homepage (without
 * prices) and on the hidden /access page (with prices).
 *
 * Layout: Trade System is content-heavy (что входит + чего нет + архив + переход),
 * so it renders as ONE full-width card with a 2-column inner body — that keeps it
 * short instead of a tall narrow column. Practicum + Trade OS Plus + VIP sit
 * below it as a three-step ladder. On mobile everything stacks to one column.
 *
 * Ни у одного тарифа больше нет пометки «популярный»: пока непонятно, что
 * окажется популярным, а метка на витрине выбирает за человека.
 */
type Pkg = {
  tag: string;
  name: string;
  subtitle?: string;
  forWhom: string;
  points: string[];
  notIncluded?: string[];
  upsell?: string;
  /**
   * Тот же переход выше, но без сумм — для лендинга, где цены Trade OS Plus и VIP
   * не раскрываются. По доплате они считаются в уме: $349 + $1250 = $1599.
   */
  upsellPublic?: string;
  addon?: {
    label: string;
    title: string;
    desc: string;
    honesty: string;
  };
  /** условие входа: набор идёт потоками, участников отбирают лично */
  admission?: string;
  outcome: string;
  oldPrice?: string;
  price: string;
  period: string;
  /**
   * Метка клика для аналитики. Закреплена за продуктом, а не за витринным
   * именем: тариф за $1599 остаётся `trade_os`, хотя теперь называется
   * Trade OS Plus. Иначе переименование смешало бы историю кликов.
   */
  clickId: string;
  ctaText?: string;
  ctaHref?: string;
  showPriceAlways?: boolean;
  featured?: boolean;
};

const PACKAGES: Pkg[] = [
  {
    tag: '01 · Старт',
    name: 'Trade System',
    clickId: 'trade_system',
    subtitle: 'Полностью самостоятельный',
    forWhom: 'Основной курс по стратегии школы в формате самостоятельного изучения. Весь путь вы проходите сами, в своём темпе, без моего участия.',
    points: [
      'Курс TRADE SYSTEM 2.0: 10 глав в личном кабинете',
      'Полный PDF-алгоритм системы',
      'Финальный зачёт и статус выпускника школы',
      'После зачёта — право подключить экосистему (Echo Gate, Hunter Bot, Risk Sentinel)',
    ],
    notIncluded: [
      'Моего сопровождения и разборов ваших сделок',
      'Обратной связи по домашним заданиям',
      'Личного чата со мной',
    ],
    upsell: 'В течение 30 дней после покупки оплаченное зачитывается полностью: в практикум — доплата $150, в Trade OS Plus — доплата $1250.',
    upsellPublic: 'В течение 30 дней после покупки оплаченное зачитывается полностью в счёт практикума или Trade OS Plus.',
    addon: {
      label: 'Дополнительно',
      title: 'Архив эфиров мастер-группы за 2025 год',
      desc: '12 месяцев записей: я разбираю тренировки учеников и параллельно анализирую рынок в реальном времени.',
      honesty: 'Честно: это записи, прямой вопрос мне здесь не задать. Но весь год я отвечаю на вопросы учеников, и проходя курс самостоятельно, ответы на свои вы, скорее всего, найдёте именно там.',
    },
    outcome: 'Для тех, кто уже торговал, умеет работать самостоятельно и ищет систему, а не мотивацию со стороны.',
    price: '$349',
    period: '365 дней',
    ctaText: 'Начать самостоятельно',
    ctaHref: TELEGRAM_LINKS.dm,
    showPriceAlways: true,
  },
  {
    tag: '02 · Практикум',
    name: 'Trade System Practicum',
    clickId: 'practicum',
    subtitle: '60 дней работы со мной',
    forWhom: 'Для тех, кому мало самостоятельного формата и нужен человек, у которого можно спросить.',
    points: [
      'Всё из Trade System',
      'Живое занятие раз в неделю',
      'Еженедельный разбор сделок группы в записи',
      'Личный разбор ваших сделок',
      'Закрытая группа',
    ],
    // Набор идёт потоками, мест немного. Дат и счётчиков на странице нет
    // намеренно: они устаревают, а страница должна работать круглый год.
    admission: 'Беру не всех и не в любой момент. Напишите, скажу, когда ближайший поток и подходит ли вам этот формат.',
    upsell: 'В течение 67 дней (60 дней потока плюс неделя после) оплаченные $499 зачитываются в Trade OS Plus полностью. Доплата $1100.',
    upsellPublic: 'В течение 67 дней (60 дней потока плюс неделя после) оплаченное зачитывается в Trade OS Plus полностью.',
    outcome: 'К концу 60 дней вы проходите алгоритм от направления до выхода сами.',
    price: '$499',
    period: '60 дней',
    ctaText: 'Узнать про ближайший поток',
    ctaHref: TELEGRAM_LINKS.dm,
    showPriceAlways: true,
  },
  {
    tag: '03 · Сопровождение',
    name: 'Trade OS Plus',
    clickId: 'trade_os',
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
  },
  {
    tag: '04 · Всё включено',
    name: 'VIP',
    clickId: 'trade_os_plus',
    forWhom: 'Вам нужен полный доступ ко всей системе и базе.',
    points: [
      'Всё из Trade OS Plus',
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
  { price: '$840', period: '6 месяцев', desc: 'Echo Gate, Hunter Bot и Risk Sentinel в аренду на полгода.', gift: '+ 1 месяц в подарок', featured: false },
  { price: '$1490', period: '12 месяцев', desc: 'Echo Gate, Hunter Bot и Risk Sentinel в аренду на год', gift: '+ 2 месяца в подарок', featured: true },
];

const GOLD = 'hsl(var(--accent))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant', serif", fontWeight: 500 };

export default function PackageCards({
  showPrices,
  ctaHref = TELEGRAM_LINKS.bot,
}: { showPrices: boolean; ctaHref?: string }) {
  const ts = PACKAGES[0];

  // строка «что входит»
  const includedList = (points: string[]) => (
    <ul className="space-y-2.5">
      {points.map((pt, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
          <Check size={15} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
          <span>{pt}</span>
        </li>
      ))}
    </ul>
  );

  // стандартная вертикальная карточка — практикум / Trade OS Plus / VIP
  const stdCard = (p: Pkg) => (
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
        <div className="text-mono mt-1.5" style={{ ...MONO, letterSpacing: '0.16em', color: 'hsl(var(--muted-foreground))' }}>
          {p.subtitle}
        </div>
      )}
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed" style={{ minHeight: 44 }}>{p.forWhom}</p>

      <div className="mt-5">{includedList(p.points)}</div>

      <div className="mt-5 pt-4 text-sm italic" style={{ borderTop: '1px solid hsl(var(--rule-soft))', color: 'hsl(var(--accent-dim))' }}>
        {p.outcome}
      </div>

      {p.admission && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{p.admission}</p>
      )}

      {(showPrices ? p.upsell : p.upsellPublic ?? p.upsell) && (
        <div className="mt-4 p-3.5 text-xs leading-relaxed" style={{ border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)', color: 'hsl(var(--foreground) / 0.85)' }}>
          <span className="text-mono" style={{ ...MONO, color: GOLD, display: 'block', marginBottom: 6 }}>Переход выше</span>
          {showPrices ? p.upsell : p.upsellPublic ?? p.upsell}
        </div>
      )}

      {/* распорка: цена и кнопка уезжают к низу, карточки в ряду выравниваются */}
      <div className="flex-grow" />

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
        onClick={() => trackClick(`package_${p.clickId}`)}
        className={`mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-all duration-300 group ${
          p.featured ? 'btn-primary' : 'btn-secondary'
        }`}
      >
        {p.ctaText ?? (p.featured ? 'Получить доступ' : 'Выбрать')}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  );

  return (
    <>
      <div className="grid gap-3">
        {/* Trade System — во всю ширину, содержимое в 2 колонки (низкая широкая карточка) */}
        <div className="relative p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
            <span className="text-mono" style={{ ...MONO, color: GOLD }}>{ts.tag}</span>
            <h3 className="text-foreground" style={{ fontSize: 28, lineHeight: 1.05 }}>{ts.name}</h3>
            {ts.subtitle && (
              <span className="text-mono" style={{ ...MONO, letterSpacing: '0.16em', color: 'hsl(var(--muted-foreground))' }}>{ts.subtitle}</span>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed" style={{ maxWidth: '76ch' }}>{ts.forWhom}</p>

          {/* тело: слева — что входит / чего нет, справа — архив / переход */}
          <div className="mt-6 grid md:grid-cols-2 gap-x-10 gap-y-6">
            <div>
              {includedList(ts.points)}
              {ts.notIncluded && (
                <div className="mt-5">
                  <div className="text-mono mb-2.5" style={{ ...MONO, color: 'hsl(var(--muted-foreground) / 0.7)' }}>Чего здесь нет</div>
                  <ul className="space-y-2.5">
                    {ts.notIncluded.map((nt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground/70">
                        <X size={15} style={{ marginTop: 2, flexShrink: 0, opacity: 0.5 }} />
                        <span>{nt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {ts.addon && (
                <div className="p-4" style={{ border: '1px solid hsl(var(--accent) / 0.22)', background: 'hsl(var(--accent) / 0.035)' }}>
                  <div className="text-mono" style={{ ...MONO, color: GOLD }}>{ts.addon.label}</div>
                  <div className="mt-2.5">
                    <span className="text-sm text-foreground/90 leading-snug">+ {ts.addon.title}</span>
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{ts.addon.desc}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{ts.addon.honesty}</p>
                </div>
              )}
              {(showPrices ? ts.upsell : ts.upsellPublic ?? ts.upsell) && (
                <div className="p-3.5 text-xs leading-relaxed" style={{ border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)', color: 'hsl(var(--foreground) / 0.85)' }}>
                  <span className="text-mono" style={{ ...MONO, color: GOLD, display: 'block', marginBottom: 6 }}>Переход выше</span>
                  {showPrices ? ts.upsell : ts.upsellPublic ?? ts.upsell}
                </div>
              )}
            </div>
          </div>

          {/* низ: слева — для кого + цена, справа — кнопка */}
          <div className="mt-6 pt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-5" style={{ borderTop: '1px solid hsl(var(--rule-soft))' }}>
            <div className="md:max-w-[62%]">
              <p className="text-sm italic" style={{ color: 'hsl(var(--accent-dim))' }}>{ts.outcome}</p>
              <div className="mt-4 flex items-baseline gap-3">
                <span style={{ ...SERIF, fontSize: 38, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{ts.price}</span>
                <span className="text-mono" style={{ ...MONO, letterSpacing: '0.14em', color: 'hsl(var(--muted-foreground))' }}>{ts.period}</span>
              </div>
            </div>
            <a
              href={ts.ctaHref ?? ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('package_trade_system')}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium group flex-shrink-0"
            >
              {ts.ctaText ?? 'Выбрать'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Практикум + Trade OS Plus + VIP — лестница под Trade System.
            На планшете по две в ряд, на телефоне в одну колонку. */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.slice(1).map(stdCard)}
        </div>
      </div>

      {/* ecosystem subscription — graduates only */}
      <div className="mt-3 p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <h3 className="text-foreground" style={{ fontSize: 28, lineHeight: 1.05 }}>Подписка на экосистему</h3>
        <div className="text-mono mt-1.5" style={{ ...MONO, letterSpacing: '0.16em', color: 'hsl(var(--cool))' }}>только выпускникам</div>
        <p className="mt-3 text-sm md:text-base text-muted-foreground" style={{ maxWidth: '70ch' }}>
          Доступ к инфраструктуре исполнения для выпускников: <b className="text-foreground/90">Echo Gate</b> — допуск: присылает разрешённые входы, <b className="text-foreground/90">Hunter Bot</b> — автоисполнение и сопровождение, <b className="text-foreground/90">Risk Sentinel</b> — защита капитала. Подписка — аренда на срок; решение всегда за вами.
        </p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
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
