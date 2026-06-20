import { ArrowRight, Check } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

type Pkg = {
  tag: string;
  name: string;
  promise: string;
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
    promise: 'Перестроить мышление и видеть рынок системно — самостоятельно.',
    points: [
      'Алгоритм принятия решений без угадываний',
      'Чек-листы подготовки и входа в сделку',
      'Записи всех прямых эфиров за год',
      'Изучение в своём темпе',
    ],
    outcome: 'Поймёте, как думает крупный игрок.',
    oldPrice: '$800',
    price: '$599',
    period: '90 дней',
  },
  {
    tag: '02 · Популярный',
    name: 'Trade OS',
    promise: 'Полная система и инструменты для методичной торговли без эмоций.',
    points: [
      'Разбор и настройка вашей торговли',
      'Инструменты и шаблоны системы',
      'Сценарии для разных фаз рынка',
      'Сопровождение сделок + закрытая группа',
    ],
    outcome: 'Меньше сделок — выше потенциал каждой.',
    oldPrice: '$1799',
    price: '$1599',
    period: '365 дней',
    featured: true,
  },
  {
    tag: '03 · Всё включено',
    name: 'Trade OS Plus',
    promise: 'Полный доступ к системе, инструментам и автоматизации.',
    points: [
      'Всё из Trade OS',
      'Индикаторы, скрипты и таблицы системы',
      'HunterBot — полуавтоисполнение сделок',
      'Risk Sentinel — защита капитала',
    ],
    outcome: 'Система работает — решения за вами.',
    oldPrice: '$3000',
    price: '$2990',
    period: 'всё включено',
  },
];

const GOLD = 'hsl(var(--accent))';

const LevelsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/40 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">11 · Сотрудничество</span>
          <h2 className="text-foreground">
            Выберите <em>формат</em> работы
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '56ch' }}>
            Не курс ради курса, а система, которая остаётся с вами. От алгоритма принятия решений —
            до полной инфраструктуры с автоисполнением и защитой капитала.
          </p>
        </div>

        <div className="mt-8 md:mt-12 grid md:grid-cols-3 gap-3">
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
              <div
                className="text-mono"
                style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}
              >
                {p.tag}
              </div>
              <h3 className="mt-2 text-foreground" style={{ fontSize: 28, lineHeight: 1.05 }}>{p.name}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed" style={{ minHeight: 44 }}>
                {p.promise}
              </p>

              {/* value points */}
              <ul className="mt-5 space-y-2.5 flex-1">
                {p.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <Check size={15} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              {/* outcome */}
              <div
                className="mt-5 pt-4 text-sm italic"
                style={{ borderTop: '1px solid hsl(var(--rule-soft))', color: 'hsl(var(--accent-dim))' }}
              >
                {p.outcome}
              </div>

              {/* price */}
              <div className="mt-5 flex items-baseline gap-3">
                <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, fontSize: 38, lineHeight: 1, color: 'hsl(var(--foreground))' }}>
                  {p.price}
                </span>
                <span className="text-sm line-through" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{p.oldPrice}</span>
              </div>
              <div className="text-mono mt-1" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
                {p.period}
              </div>

              {/* button */}
              <a
                href={TELEGRAM_LINKS.bot}
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
          <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'hsl(var(--cool))' }}>
            Подписка на экосистему · только выпускникам
          </div>
          <p className="mt-3 text-sm md:text-base text-muted-foreground" style={{ maxWidth: '70ch' }}>
            <b className="text-foreground/90">Echo-Gate</b> — сигнальный бот, <b className="text-foreground/90">HunterBot</b> — автоисполнение и сопровождение, <b className="text-foreground/90">Risk Sentinel</b> — защита капитала. Инфраструктура берёт рутину на себя — решение всегда за вами.
          </p>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div className="p-4" style={{ border: '1px solid hsl(var(--rule-soft))' }}>
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, fontSize: 26, color: 'hsl(var(--foreground))' }}>$447</span>
                <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>/ 3 месяца</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Всё в аренду — попробовать инфраструктуру.</p>
            </div>
            <div className="p-4" style={{ border: '1px solid hsl(var(--accent) / 0.3)' }}>
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, fontSize: 26, color: 'hsl(var(--foreground))' }}>$1490</span>
                <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>/ 365 дней</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Echo-Gate в аренду; HunterBot и Risk Sentinel — навсегда. <b className="text-foreground/90">+2 месяца в подарок</b>.</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Места ограничены · набор закрывается в ближайшее воскресенье ·{' '}
          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            задать вопрос Сергею
          </a>
        </p>
      </div>
    </section>
  );
};

export default LevelsSection;
