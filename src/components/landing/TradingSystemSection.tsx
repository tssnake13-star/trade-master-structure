/**
 * TradingSystemSection — «03 · Архитектура». v3 editorial-terminal вариант.
 * Группировка: триггер (Trend Hunter) сверху → две стратегии-фильтра в ряд
 * (Echo Gate · Trade Master | Resonance Scanner · Nexus Gravity) → трейдер →
 * золотой узел-слияние → единая ось исполнения (Hunter Bot → Risk Sentinel).
 * Острые карточки, тонкие линии, без скруглений/теней. Тексты прежние.
 */

const GOLD = 'hsl(var(--accent))';

type FlowNode = { n: string; name: string; desc: string; tag?: string; badge?: string };

const trigger: FlowNode = {
  n: '01',
  tag: 'Триггер · H4',
  name: 'Trend Hunter',
  desc: 'Сканирует H4, ищет триггер точки входа и отправляет сигнал дальше.',
};

const filters: FlowNode[] = [
  {
    n: '02',
    tag: 'Trade Master',
    name: 'Echo Gate',
    desc: 'Фильтрует триггер по архиву сделок, геометрии и контексту W1 / D1. Результат: допуск или отказ.',
  },
  {
    n: '02',
    tag: 'Nexus Gravity · M15',
    name: 'Resonance Scanner',
    desc: 'Сканирует инструменты, отправляет сигналы по резонансу.',
    badge: '1.23x — 1.49x импульс',
  },
];

const spine: FlowNode[] = [
  { n: '▸', tag: 'Автоисполнение', name: 'Hunter Bot', desc: 'Открывает сделку по распоряжению трейдера.' },
  { n: '◆', tag: 'Защита счёта', name: 'Risk Sentinel', desc: 'Контроль лимитов, 4 уровня защиты и блокировка при превышении риска.' },
];

const stats = [
  { value: '10:1', label: 'Среднее соотношение в сделках', sub: 'Торговля с 2012 года' },
  { value: 'H4', label: 'Таймфрейм триггера', sub: 'Trade Master' },
  { value: 'M15', label: 'Таймфрейм триггера', sub: 'Nexus Gravity' },
];

const Node = ({ node, accent = false }: { node: FlowNode; accent?: boolean }) => (
  <div style={{ paddingBottom: 20 }}>
    <div
      className="p-4 h-full"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderLeft: `2px solid hsl(var(--accent)${accent ? '' : ' / 0.45'})`,
      }}
    >
      {node.tag && (
        <div className="text-mono" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 3 }}>
          {node.tag}
        </div>
      )}
      <h4 className="font-serif" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1, color: 'hsl(var(--foreground))' }}>{node.name}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{node.desc}</p>
      {node.badge && (
        <span className="mt-2.5 inline-flex text-mono" style={{ fontSize: 10, color: 'hsl(var(--foreground) / 0.7)', border: '1px solid hsl(var(--foreground) / 0.15)', padding: '2px 8px' }}>
          {node.badge}
        </span>
      )}
    </div>
  </div>
);

const Conn = () => (
  <div className="flex justify-center" style={{ marginTop: -6, marginBottom: 6 }}>
    <span style={{ width: 2, height: 26, background: 'hsl(var(--border))' }} />
  </div>
);

const TradingSystemSection = () => {
  return (
    <section id="trading-system" className="py-16 md:py-24 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          <span className="section-label">08 · Архитектура</span>
          <h2 className="text-foreground mb-3">
            Как работает <em>система</em> <span className="mute">изнутри</span>
          </h2>
          <div className="text-mono" style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
            Две стратегии · одна экосистема · единый риск-менеджмент
          </div>

          {/* trigger — Trend Hunter on top */}
          <div className="mt-10 md:mt-12 mx-auto" style={{ maxWidth: 480 }}>
            <Node node={trigger} />
          </div>

          <Conn />

          {/* two strategy filters side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 items-stretch">
            {filters.map((f) => (
              <Node key={f.name} node={f} />
            ))}
          </div>

          <Conn />

          {/* trader decision divider */}
          <div className="flex items-center justify-center gap-3 text-center">
            <span className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.25), transparent)' }} />
            <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
              Трейдер · финальное решение
            </span>
            <span className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.25), transparent)' }} />
          </div>

          {/* merge node */}
          <div className="flex justify-center my-6">
            <span style={{ width: 10, height: 10, background: GOLD, transform: 'rotate(45deg)' }} />
          </div>

          {/* unified execution spine */}
          <div className="mx-auto" style={{ maxWidth: 480 }}>
            <div className="text-mono text-center mb-5" style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
              Единый путь исполнения
            </div>
            <div>
              {spine.map((node) => (
                <Node key={node.name} node={node} accent />
              ))}
            </div>
          </div>

          {/* stats */}
          <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.value} className="p-4 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="font-serif" style={{ fontSize: 30, fontStyle: 'italic', lineHeight: 1, color: 'hsl(var(--foreground))' }}>{stat.value}</div>
                <div className="mt-2 text-sm leading-snug text-foreground">{stat.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradingSystemSection;
