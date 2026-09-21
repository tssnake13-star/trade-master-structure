import { ACCENT, DIM, DOWN, FG, MONO, UP, card, label, fmtDate } from './theme';

// Форма данных витрины — то, что кладёт мост с VPS (terminal_publish.py).

export interface Cycle {
  'угол'?: string;
  'якорь'?: number;
  'дата'?: string;
  'средняя'?: number;
  'цель'?: number;
  'спираль'?: number;
  'переходы'?: number;
  'пройдено'?: number;
  'полтора'?: number;
  'отработан'?: boolean;
  // с 21.09.2026 мост считает их функциями бота (cycles_report._progress): пройдено —
  // максимум хода или текущая цена, что дальше; сейчас — где цена; запас — до цели
  'пройдено_всего'?: number;
  'сейчас'?: number;
  'запас_п'?: number | null;
  'запас_atr'?: number | null;
  'цель_взята'?: boolean;
}

export interface MarketRow {
  symbol: string;
  title: string | null;
  group_key: string | null;
  sort_order: number | null;
  price: number | null;
  price_text: string | null;
  side: 'LONG' | 'SHORT' | null;
  scenario: string | null;
  confirmation: boolean | null;
  guide: string | null;
  w_dir: string | null;
  w_n: number | null;
  d_dir: string | null;
  d_n: number | null;
  trend_w1: string | null;
  trend_d1: string | null;
  trend_total: string | null;
  cycle_w1: Cycle | null;
  cycle_d1: Cycle | null;
  card_lines: string[] | null;
  trend_lines: string[] | null;
  range_lines: string[] | null;
  chart_cycles: string | null;
  chart_trend: string | null;
  chart_all: string | null;
  // leads — код группы, которую инструмент ведёт сам (USDJPY → JPY); leader — его поводырь.
  // w_votes / d_votes — голоса недели и дневки по отдельности ([имя, UP/DOWN/NONE]), w_anom —
  // пометка, если неделю сняла аномальная свеча (мост с 21.09.2026, вечер)
  extra?: {
    leads?: string | null;
    leader?: string | null;
    w_votes?: [string, string][];
    d_votes?: [string, string][];
    w_anom?: string | null;
  } | null;
  bars_at: string | null;
  updated_at: string | null;
}

/** Куда смотрит тренд по накоплениям — стрелкой, как в списке терминала. */
export function Arrow({ text }: { text: string | null }) {
  const t = (text || '').toLowerCase();
  const up = t.includes('вверх');
  const down = t.includes('вниз');
  return (
    <span style={{ fontFamily: MONO, fontSize: 12, color: up ? UP : down ? DOWN : DIM }}>
      {up ? '↑↑' : down ? '↓↓' : '~'}
    </span>
  );
}

export function Side({ side }: { side: string | null }) {
  if (!side) return <span style={{ color: DIM, fontFamily: MONO, fontSize: 11 }}>—</span>;
  const long = side === 'LONG';
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: '0.1em',
        color: long ? UP : DOWN,
        border: `1px solid ${long ? UP : DOWN}44`,
        backgroundColor: long ? `${UP}14` : `${DOWN}14`,
        borderRadius: 6,
        padding: '2px 7px',
      }}
    >
      {side}
    </span>
  );
}

function num(v: number | undefined | null, digits = 4) {
  return typeof v === 'number' ? v.toFixed(digits) : '—';
}

/**
 * Столбик «пройдено по циклу» — его просьба 21.09.2026 по макету: неделя синим,
 * дневка зелёным. Заполнен снизу на столько, сколько цикла уже пройдено; пустой
 * верх — запас хода до цели.
 */
function Gauge({ pct, color }: { pct: number; color: string }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 48, flexShrink: 0 }}>
      <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color }}>{v}%</span>
      <div style={{ width: 28, flex: 1, minHeight: 96, borderRadius: 9, backgroundColor: '#1b1f25', border: `1px solid ${color}40`, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: `${v}%`, background: `linear-gradient(180deg, ${color}, ${color}b3)`, borderRadius: 8 }} />
      </div>
      <span style={{ ...label, fontSize: 8, letterSpacing: '0.12em' }}>пройдено</span>
    </div>
  );
}

export function CycleCard({ title, c, color = ACCENT, dg = 4 }: { title: string; c: Cycle | null; color?: string; dg?: number }) {
  if (!c) {
    return (
      <div style={{ ...card, padding: 12, marginBottom: 10 }}>
        <div style={label}>{title}</div>
        <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>цикла нет</div>
      </div>
    );
  }
  // пока мост на VPS старый — берём прежнее «пройдено» (максимум хода)
  const done = Math.min(100, c['пройдено_всего'] ?? c['пройдено'] ?? 0);
  const taken = c['цель_взята'] ?? (c['пройдено'] ?? 0) >= 99.5;
  const now = c['сейчас'];
  const passed = taken
    ? 'цель взята, ход выработан'
    : `${Math.round(done)}% · осталось ${Math.max(0, 100 - Math.round(done))}%` +
      (now != null && done - now >= 5 ? ` · цена сейчас на ${Math.round(now)}%` : '');
  const reserve =
    c['запас_п'] != null
      ? `${c['запас_п']} п${c['запас_atr'] != null ? ` · ${String(c['запас_atr']).replace('.', ',')} ATR` : ''}`
      : null;
  const rows: [string, string][] = [
    ['угол', c['угол'] || '—'],
    ['начало', `${num(c['якорь'], dg)} от ${fmtDate(c['дата'])}`],
    ['цель', num(c['цель'], dg)],
    ['пройдено', passed],
    ...(reserve && !taken ? ([['запас хода', reserve]] as [string, string][]) : []),
    ['середина', num(c['средняя'], dg)],
    ['1,5 цикла', num(c['полтора'], dg)],
    ['спираль', c['спираль'] != null ? String(c['спираль']) : '—'],
    ['переходов', c['переходы'] != null ? String(c['переходы']) : '—'],
  ];
  return (
    <div style={{ ...card, padding: 12, marginBottom: 10 }}>
      <div style={{ ...label, color }}>{title}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 0' }}>
              <span style={{ color: DIM, fontSize: 12, flexShrink: 0 }}>{k}</span>
              <span style={{ color: FG, fontFamily: MONO, fontSize: 12, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
        <Gauge pct={taken ? 100 : done} color={color} />
      </div>
      {taken ? (
        <div style={{ ...label, marginTop: 6, color: ACCENT }}>цель взята</div>
      ) : c['отработан'] ? (
        <div style={{ ...label, marginTop: 6 }}>пройден 90%+ · цель не взята, цикл живой</div>
      ) : null}
    </div>
  );
}

export function Lines({ lines }: { lines: string[] | null }) {
  if (!lines || !lines.length) return <div style={{ color: DIM, fontSize: 13 }}>пока пусто</div>;
  return (
    <div style={{ whiteSpace: 'pre-wrap', color: FG, fontSize: 13, lineHeight: 1.6 }}>
      {lines.join('\n')}
    </div>
  );
}
