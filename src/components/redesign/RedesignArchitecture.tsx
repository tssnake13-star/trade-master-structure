/**
 * RedesignArchitecture
 *
 * Two-block section for /preview-redesign:
 *   A. Horizontal timeline of the 4 admission filters (W1 → D1 → H4 → D1)
 *   B. Editorial SVG diagram of the Trade OS architecture:
 *      - dashed outer ellipse  → Trade OS  (cool)
 *      - solid inner ellipse   → Trade Core (warm)
 *      - center node           → Core / Зона синхронизации / Trade System
 *      - 4 filter nodes around the core, dashed-connected
 *      - 4 module rectangles in corners (M01..M04)
 *      - faint 40x40 grid background
 *
 * No data props — content matches the brief (filters + modules) and is editable
 * inline. Mobile reuses the same SVG via responsive viewBox.
 */

const filters = [
  {
    num: '01',
    tf: 'W1',
    title: 'Контекст',
    body: 'Недельная фаза рынка. Тренд, диапазон, переход. Решает, торгуем ли вообще.',
  },
  {
    num: '02',
    tf: 'D1',
    title: 'Подтверждение',
    body: 'Дневная структура совпадает с недельным контекстом. Без совпадения — стоп.',
  },
  {
    num: '03',
    tf: 'H4',
    title: 'Вход',
    body: 'Точка с просчитанным риском, а не ощущение «пора». Конкретный уровень.',
  },
  {
    num: '04',
    tf: 'D1',
    title: 'Выход',
    body: 'Сценарий выхода фиксируется до сделки. Решение принимается заранее.',
  },
];

const modules = [
  { code: 'M01', name: 'CONTEXT', desc: 'Чтение фазы рынка' },
  { code: 'M02', name: 'NOISE FILTER', desc: 'Отсев ложных сигналов' },
  { code: 'M03', name: 'RISK SENTINEL', desc: 'Контроль риска и просадки' },
  { code: 'M04', name: 'JOURNAL', desc: 'Аудит решений' },
];

const RedesignArchitecture = () => {
  return (
    <section id="system" className="relative">
      {/* ========== A. Horizontal timeline ========== */}
      <div className="container-landing pt-24 md:pt-32 lg:pt-40 pb-20 md:pb-28">
        <div className="kicker reveal mb-8">
          <span className="num">03</span>
          <span className="dot" />
          <span>FIG_03 · ADMISSION FLOW</span>
        </div>

        <h2 className="reveal max-w-[18ch] mb-6 text-foreground">
          Четыре фильтра <em>допуска.</em>
        </h2>
        <p className="lede reveal mb-16 md:mb-24" style={{ transitionDelay: '120ms' }}>
          Сделка проходит четыре последовательные проверки. Если хоть одна не совпала —
          вход не происходит. Это не настроение, это процедура.
        </p>

        {/* Desktop: horizontal track */}
        <div className="hidden md:block reveal" style={{ transitionDelay: '200ms' }}>
          <div className="relative">
            {/* connecting line */}
            <div
              className="absolute top-[7px] left-[2.5%] right-[2.5%] h-px"
              style={{
                background:
                  'linear-gradient(90deg, hsl(var(--cool) / 0.05), hsl(var(--cool) / 0.55) 15%, hsl(var(--cool) / 0.55) 85%, hsl(var(--cool) / 0.05))',
              }}
            />
            <div className="grid grid-cols-4 gap-8">
              {filters.map((f) => (
                <div key={f.num} className="relative pt-8">
                  {/* dot */}
                  <span
                    className="absolute top-0 left-0 block rounded-full"
                    style={{
                      width: 14,
                      height: 14,
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--cool))',
                      boxShadow: '0 0 0 4px hsl(var(--background))',
                    }}
                  >
                    <span
                      className="absolute inset-1 rounded-full block"
                      style={{ background: 'hsl(var(--cool))' }}
                    />
                  </span>

                  <div
                    className="text-mono mb-3"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--muted-foreground) / 0.7)',
                    }}
                  >
                    <span style={{ color: 'hsl(var(--cool))' }}>{f.num}</span>
                    <span className="mx-2 opacity-40">·</span>
                    <span>{f.title}</span>
                    <span className="mx-2 opacity-40">/</span>
                    <span>{f.tf}</span>
                  </div>

                  <h3 className="text-foreground mb-3" style={{ fontSize: 22 }}>
                    {f.title}
                  </h3>
                  <p
                    className="text-muted-foreground"
                    style={{ maxWidth: '22ch', fontSize: 14, lineHeight: 1.55 }}
                  >
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical list */}
        <div className="md:hidden flex flex-col gap-6 reveal">
          {filters.map((f, i) => (
            <div
              key={f.num}
              className="relative pl-8 pb-6"
              style={{
                borderLeft:
                  i < filters.length - 1 ? '1px dashed hsl(var(--cool) / 0.4)' : 'none',
              }}
            >
              <span
                className="absolute -left-[7px] top-0 block rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--cool))',
                }}
              >
                <span
                  className="absolute inset-1 rounded-full block"
                  style={{ background: 'hsl(var(--cool))' }}
                />
              </span>
              <div
                className="text-mono mb-2"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--muted-foreground) / 0.7)',
                }}
              >
                <span style={{ color: 'hsl(var(--cool))' }}>{f.num}</span>
                <span className="mx-2 opacity-40">·</span>
                <span>{f.title}</span>
                <span className="mx-2 opacity-40">/</span>
                <span>{f.tf}</span>
              </div>
              <h3 className="text-foreground mb-2" style={{ fontSize: 20 }}>
                {f.title}
              </h3>
              <p
                className="text-muted-foreground"
                style={{ fontSize: 14, lineHeight: 1.55 }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ========== B. Architecture SVG ========== */}
      <div className="container-landing pb-24 md:pb-32 lg:pb-40">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
          <h2 className="reveal max-w-[20ch] text-foreground">
            Trade OS — <em>архитектура</em>.
          </h2>
          <span
            className="text-mono reveal"
            style={{
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted-foreground) / 0.5)',
            }}
          >
            FIG_03.1 · ARCH_DIAGRAM
          </span>
        </div>

        <p className="lede reveal mb-12 md:mb-16" style={{ transitionDelay: '120ms' }}>
          Внешний слой — операционная система решений. Ядро — синхронизация фильтров.
          Между ними — четыре модуля, которые не дают системе сбиться.
        </p>

        <div
          className="reveal relative w-full"
          style={{ transitionDelay: '200ms', aspectRatio: '16 / 10' }}
        >
          <ArchitectureSVG />
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   SVG diagram — pure SVG, no images. Uses --warm / --cool tokens.
   ============================================================ */
const ArchitectureSVG = () => {
  // viewBox in arbitrary units — content scales to container
  const W = 1600;
  const H = 1000;
  const cx = W / 2;
  const cy = H / 2;

  // Outer (Trade OS) ellipse
  const outerRx = 700;
  const outerRy = 400;

  // Inner (Trade Core) ellipse
  const innerRx = 420;
  const innerRy = 240;

  // Filter nodes positioned around the core
  const nodes = [
    { id: 'W1', label: 'W1', sub: 'ФАЗА', x: cx - innerRx, y: cy },
    { id: 'D1', label: 'D1', sub: 'ПОДТВ', x: cx, y: cy - innerRy },
    { id: 'H4', label: 'H4', sub: 'ВХОД', x: cx + innerRx, y: cy },
    { id: 'D1x', label: 'D1', sub: 'ВЫХОД', x: cx, y: cy + innerRy },
  ];

  // Module rectangles in corners
  const corners = [
    { ...modules[0], x: 40, y: 40, anchor: 'start' as const },
    { ...modules[1], x: W - 40, y: 40, anchor: 'end' as const },
    { ...modules[2], x: 40, y: H - 40, anchor: 'start' as const, bottom: true },
    { ...modules[3], x: W - 40, y: H - 40, anchor: 'end' as const, bottom: true },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="absolute inset-0 w-full h-full"
      role="img"
      aria-label="Архитектура Trade OS — внешний слой и ядро Trade Core"
    >
      {/* Grid pattern */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="hsl(var(--rule-soft))"
            strokeWidth="1"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />

      {/* Outer ellipse — Trade OS (dashed, cool) */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={outerRx}
        ry={outerRy}
        fill="none"
        stroke="hsl(var(--cool))"
        strokeOpacity="0.6"
        strokeWidth="1.25"
        strokeDasharray="6 8"
      />
      {/* Outer ellipse label */}
      <text
        x={cx}
        y={cy - outerRy - 18}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize="22"
        letterSpacing="6"
        fill="hsl(var(--cool))"
        opacity="0.85"
      >
        TRADE OS
      </text>

      {/* Inner ellipse — Trade Core (solid, warm) */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={innerRx}
        ry={innerRy}
        fill="hsl(var(--background))"
        stroke="hsl(var(--warm))"
        strokeOpacity="0.7"
        strokeWidth="1.25"
      />
      <text
        x={cx + innerRx + 14}
        y={cy - innerRy + 18}
        textAnchor="start"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize="18"
        letterSpacing="5"
        fill="hsl(var(--warm))"
        opacity="0.8"
      >
        TRADE CORE
      </text>

      {/* Connections core ↔ filter nodes */}
      {nodes.map((n) => (
        <line
          key={`l-${n.id}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke="hsl(var(--warm))"
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      ))}

      {/* Center node */}
      <g>
        <circle
          cx={cx}
          cy={cy}
          r="86"
          fill="hsl(var(--background))"
          stroke="hsl(var(--warm))"
          strokeWidth="1.25"
        />
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontFamily="'Fraunces', Georgia, serif"
          fontSize="38"
          fontStyle="italic"
          fill="hsl(var(--warm))"
        >
          Core
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          fontSize="11"
          letterSpacing="3"
          fill="hsl(var(--foreground))"
          opacity="0.75"
        >
          ЗОНА СИНХРОНИЗАЦИИ
        </text>
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          fontSize="10"
          letterSpacing="3"
          fill="hsl(var(--muted-foreground))"
          opacity="0.6"
        >
          TRADE SYSTEM
        </text>
      </g>

      {/* Filter nodes */}
      {nodes.map((n) => (
        <g key={`n-${n.id}`}>
          <circle
            cx={n.x}
            cy={n.y}
            r="44"
            fill="hsl(var(--background))"
            stroke="hsl(var(--cool))"
            strokeWidth="1"
          />
          <text
            x={n.x}
            y={n.y - 4}
            textAnchor="middle"
            fontFamily="'Fraunces', Georgia, serif"
            fontSize="22"
            fill="hsl(var(--cool))"
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + 16}
            textAnchor="middle"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            fontSize="9"
            letterSpacing="2.5"
            fill="hsl(var(--muted-foreground))"
            opacity="0.75"
          >
            {n.sub}
          </text>
        </g>
      ))}

      {/* Module rectangles (corners) */}
      {corners.map((m, i) => {
        const w = 320;
        const h = 78;
        const x = m.anchor === 'start' ? m.x : m.x - w;
        const y = m.bottom ? m.y - h : m.y;
        return (
          <g key={`m-${i}`}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="hsl(var(--background))"
              stroke="hsl(var(--cool))"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <text
              x={x + 16}
              y={y + 28}
              fontFamily="'JetBrains Mono', ui-monospace, monospace"
              fontSize="11"
              letterSpacing="3"
              fill="hsl(var(--cool))"
            >
              <tspan opacity="0.8">{m.code}</tspan>
              <tspan dx="10" fill="hsl(var(--foreground))" opacity="0.85">
                · {m.name}
              </tspan>
            </text>
            <text
              x={x + 16}
              y={y + 54}
              fontFamily="'Fraunces', Georgia, serif"
              fontSize="18"
              fill="hsl(var(--muted-foreground))"
              opacity="0.85"
            >
              {m.desc}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default RedesignArchitecture;