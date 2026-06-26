/**
 * TradingSystemSection — «03 · Архитектура». v3 editorial-terminal вариант:
 * каждый путь — вертикальная «структурная линия» с нумерованными узлами
 * (как лестница в кабинете и фон «Структура»). Два пути сходятся в золотом
 * узле-ромбе → единая ось исполнения (Hunter Bot → Risk Sentinel). Острые
 * карточки, тонкие линии, без скруглений/теней. Тексты и смыслы прежние.
 */

const GOLD = 'hsl(var(--accent))';

type FlowNode = { n: string; name: string; desc: string; badge?: string };

const tracks: { eyebrow: string; tf: string; nodes: FlowNode[] }[] = [
  {
    eyebrow: 'Архив · Trade Master',
    tf: 'H4',
    nodes: [
      { n: '01', name: 'Trend Hunter', desc: 'Сканирует H4, ищет триггер точки входа и отправляет сигнал дальше.' },
      { n: '02', name: 'Echo Gate', desc: 'Фильтрует триггер по архиву сделок, геометрии и контексту W1 / D1. Результат: допуск или отказ.' },
    ],
  },
  {
    eyebrow: 'Резонанс · Nexus Gravity',
    tf: 'M15',
    nodes: [
      { n: '01', name: 'Resonance Scanner', desc: 'Сканирует инструменты и формирует ТОП по резонансу W1 / D1.', badge: '1.23x — 1.49x импульс' },
    ],
  },
];

const spine: { tag: string; name: string; desc: string }[] = [
  { tag: 'Автоисполнение', name: 'Hunter Bot', desc: 'Открывает сделку по распоряжению трейдера.' },
  { tag: 'Защита счёта', name: 'Risk Sentinel', desc: 'Контроль лимитов, 4 уровня защиты и блокировка при превышении риска.' },
];

const stats = [
  { value: '10:1', label: 'Среднее соотношение в сделках', sub: 'Торговля с 2012 года' },
  { value: 'H4', label: 'Таймфрейм триггера', sub: 'Trade Master' },
  { value: 'M15', label: 'Таймфрейм триггера', sub: 'Nexus Gravity' },
];

const Node = ({ node, accent = false }: { node: FlowNode & { tag?: string }; accent?: boolean }) => (
  <div className="relative" style={{ paddingLeft: 32, paddingBottom: 20 }}>
    <span
      className="absolute text-mono flex items-center justify-center"
      style={{
        left: 0, top: 6, width: 18, height: 18, borderRadius: '50%', fontSize: 8,
        color: accent ? 'hsl(var(--background))' : GOLD,
        background: accent ? GOLD : 'hsl(var(--background))',
        border: `1.5px solid ${GOLD}`,
      }}
    >
      {node.n}
    </span>
    <div className="p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
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

const Track = ({ nodes, accent = false }: { nodes: (FlowNode & { tag?: string })[]; accent?: boolean }) => (
  <div className="relative">
    {/* structural line */}
    <span
      className="absolute"
      style={{ left: 8, top: 8, bottom: 26, width: 2, background: accent ? `hsl(var(--accent) / 0.5)` : 'hsl(var(--border))' }}
    />
    {nodes.map((node) => (
      <Node key={node.name} node={node} accent={accent} />
    ))}
  </div>
);

const TradingSystemSection = () => {
  return (
    <section id="trading-system" className="py-16 md:py-24 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl mx-auto">
          <span className="section-label">03 · Архитектура</span>
          <h2 className="text-foreground mb-3">
            Как работает <em>система</em> <span className="mute">изнутри</span>
          </h2>
          <div className="text-mono" style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
            Две стратегии · одна экосистема · единый риск-менеджмент
          </div>

          {/* two strategy tracks */}
          <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {tracks.map((track) => (
              <div key={track.eyebrow}>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
                    {track.eyebrow}
                  </span>
                  <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'hsl(var(--accent-dim))' }}>· {track.tf}</span>
                </div>
                <Track nodes={track.nodes} />
              </div>
            ))}
          </div>

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
            <Track nodes={spine.map((s, i) => ({ n: i === 0 ? '▸' : '◆', name: s.name, desc: s.desc, tag: s.tag }))} accent />
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
