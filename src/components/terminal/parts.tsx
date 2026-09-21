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
  // leads — код группы, которую инструмент ведёт сам (USDJPY → JPY); leader — его поводырь
  extra?: { leads?: string | null; leader?: string | null } | null;
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

/** Полоса «пройдено / осталось» — то же число, что бот называет словами. */
function Progress({ pct }: { pct: number | undefined }) {
  const v = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 6, borderRadius: 4, backgroundColor: '#211e1a', overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', backgroundColor: ACCENT }} />
      </div>
      <div style={{ ...label, marginTop: 4 }}>пройдено {v}% · осталось {100 - v}%</div>
    </div>
  );
}

export function CycleCard({ title, c }: { title: string; c: Cycle | null }) {
  if (!c) {
    return (
      <div style={{ ...card, padding: 12, marginBottom: 10 }}>
        <div style={label}>{title}</div>
        <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>цикла нет</div>
      </div>
    );
  }
  const rows: [string, string][] = [
    ['угол', c['угол'] || '—'],
    ['начало', `${num(c['якорь'])} от ${fmtDate(c['дата'])}`],
    ['середина', num(c['средняя'])],
    ['цель', num(c['цель'])],
    ['1,5 цикла', num(c['полтора'])],
    ['спираль', c['спираль'] != null ? String(c['спираль']) : '—'],
    ['переходов', c['переходы'] != null ? String(c['переходы']) : '—'],
  ];
  return (
    <div style={{ ...card, padding: 12, marginBottom: 10 }}>
      <div style={label}>{title}</div>
      <div style={{ marginTop: 8 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 0' }}>
            <span style={{ color: DIM, fontSize: 12 }}>{k}</span>
            <span style={{ color: FG, fontFamily: MONO, fontSize: 12, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>
      <Progress pct={c['пройдено']} />
      {c['отработан'] ? <div style={{ ...label, marginTop: 6, color: ACCENT }}>цель взята</div> : null}
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
