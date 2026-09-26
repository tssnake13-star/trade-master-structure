import { ACCENT, DIM, DOWN, FG, MONO, SANS, UP, card, label, fmtDate } from './theme';

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
  // 22.09.2026, его правило полупериодов: цель взята, переходов и разворота нет — цикл идёт
  // дальше. цель_номер 2 — третий полупериод от якоря (цель №1 — обычная цель, два полупериода);
  // цели — все уровни с датой, когда взяты; разворот — дата якоря нового встречного цикла
  'цель_номер'?: number;
  'полупериодов'?: number;
  'цель_1'?: number;
  'цели'?: { N: number; 'полупериодов': number; 'цель': number; 'снята': string | null }[];
  'разворот'?: string;
  // 25.09.2026, его правило: два угла по спирали вдвоём создают зону синхронизации (не шире четверти
  // периода цикла); зону прошли без разворота — следующие точки тех же углов, новая зона — цель
  'второй'?: { 'угол': string; 'касание'?: string; 'средняя'?: number; 'цель'?: number; 'цель_номер'?: number } | null;
  'зона'?: [number, number] | null;
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
    // 21.09.2026 вечер: d_votes — НАПРАВЛЕНИЕ дневки (свинг, свеча, накопления), c_votes —
    // ПОДТВЕРЖДЕНИЕ (свинг, свеча, реверс), c_dir / c_n — его итог. Два разных состояния.
    d_votes?: [string, string][];
    c_votes?: [string, string][];
    c_dir?: string | null;
    c_n?: number | null;
    w_anom?: string | null;
  } | null;
  bars_at: string | null;
  updated_at: string | null;
}

/** 23.09.2026, его слово: у индекса доллара и у других одинаково стояло «поводырь» — «напиши
 *  поводырь альфа… самый главный поводырь для долларовой пары», и следом: «альфа надо было
 *  крупно написать по-английски». Отсюда «поводырь ALPHA»: ALPHA жирно, золотом и в 1,4 раза
 *  крупнее слов рядом — размер берётся от окружающего текста, поэтому одна метка годится
 *  и для списка, и для шапки, и для клетки главного блока, и для карточки группы. */
export const ALPHA_TIP = 'индекс доллара — главный поводырь долларовых пар';
export function GuideAlpha() {
  return (
    <>
      поводырь{' '}
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '1.4em', lineHeight: 1, letterSpacing: '0.06em', color: ACCENT }}>
        ALPHA
      </span>
    </>
  );
}

/** Название инструмента в левом списке. 26.09.2026, его слово: «у поводырей из-за слова поводырь не
 *  влезает цена… название инструмента, а внизу, если это поводырь, пускай написано поводырь. Только
 *  центруй» — слово под названием, по центру названия. */
export function SymbolName({ symbol, guide, tip }: { symbol: string; guide: boolean; tip?: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'start', minWidth: 0 }}>
      <span style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.25 }}>{symbol}</span>
      {guide ? (
        <span title={tip} style={{ fontFamily: SANS, fontSize: 10, lineHeight: 1.2, color: ACCENT, marginTop: 1 }}>
          поводырь
        </span>
      ) : null}
    </span>
  );
}

/** Одна метка списка: буква таймфрейма и одна стрелка (22.09.2026, его вопрос «что обозначают
 *  стрелочки?» — сдвоенные путали), «~» — направления нет или спор. */
type Dir3 = 'LONG' | 'SHORT' | null;
const dir3 = (d: string | null | undefined): Dir3 =>
  d === 'LONG' || d === 'UP' ? 'LONG' : d === 'SHORT' || d === 'DOWN' ? 'SHORT' : null;
const WORD = { LONG: 'вверх', SHORT: 'вниз' } as const;

function Mark({ tag, d, tip }: { tag: string; d: Dir3; tip: string }) {
  return (
    <span title={tip} style={{ fontFamily: MONO, fontSize: 12, color: d === 'LONG' ? UP : d === 'SHORT' ? DOWN : DIM, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 10, opacity: 0.75, marginRight: 1 }}>{tag}</span>
      {d === 'LONG' ? '↑' : d === 'SHORT' ? '↓' : '~'}
    </span>
  );
}

/** 26.09.2026, его слово: «у каждого инструмента написано направление недели и дневки, но это
 *  направление только по накоплениям. А я хочу, чтобы был итог… недельное направление и дневное…
 *  и хорошо бы изобразить подтверждение на D1 — на D1 два значения». Н — итог критериев недели
 *  (свинг, свеча, накопления, 2 из 3), Д — итог критериев дневки, П — подтверждение дневки
 *  (свинг, свеча, реверс; реверс обязателен). Данные те же, что в главном блоке (Decision):
 *  w_dir/w_n, d_dir/d_n, extra.c_dir/c_n — экран ничего не считает. */
export function CritMarks({ r }: { r: MarketRow }) {
  const anom = r.extra?.w_anom || null;
  const w = anom ? null : dir3(r.w_dir);
  const d = dir3(r.d_dir);
  const c = dir3(r.extra?.c_dir);
  const wTip = anom
    ? 'неделя: снята аномальной свечой — сторону задаёт дневка'
    : w
      ? `неделя: ${WORD[w]}, ${r.w_n ?? '—'} из 3 (свинг, свеча, накопления)`
      : r.w_dir === 'MIXED'
        ? 'неделя: критерии в споре — сторону задаёт дневка'
        : 'неделя: направления нет';
  const dTip = d
    ? `дневка: ${WORD[d]}, ${r.d_n ?? '—'} из 3 (свинг, свеча, накопления)`
    : 'дневка: критерии в споре — направления нет';
  const cTip = c
    ? `подтверждение дневки: ${WORD[c]}, ${r.extra?.c_n ?? '—'} из 3 (свинг, свеча, реверс)`
    : 'подтверждения на дневке нет: нужен реверс и с ним свинг или свеча';
  return (
    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <Mark tag="Н" d={w} tip={wTip} />
      {/* неделя отдельно, у дневки два значения — направление и подтверждение */}
      <span style={{ width: 1, height: 12, backgroundColor: `${DIM}66`, margin: '0 2px' }} />
      <Mark tag="Д" d={d} tip={dTip} />
      <Mark tag="П" d={c} tip={cTip} />
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
  // 22.09.2026: цикл продлён полупериодами — цель называется номером, взятые цели отдельно
  const hpN = c['цель_номер'];
  const tgtLabel = hpN ? `цель №${hpN} · ${c['полупериодов']}-й полупериод` : 'цель';
  const hpTaken: [string, string][] = (c['цели'] || [])
    .filter((q) => q['снята'])
    .map((q) => [`цель №${q.N}`, `${num(q['цель'], dg)} · взята ${fmtDate(q['снята'])}`]);
  const rows: [string, string][] = [
    ['угол', c['угол'] || '—'],
    ['начало', `${num(c['якорь'], dg)} от ${fmtDate(c['дата'])}`],
    [tgtLabel, num(c['цель'], dg)],
    ...hpTaken,
    ['пройдено', passed],
    ...(reserve && !taken ? ([['запас хода', reserve]] as [string, string][]) : []),
    ['середина', num(c['средняя'], dg)],
    ...(hpN ? [] : ([['1,5 цикла', num(c['полтора'], dg)]] as [string, string][])),
    ['спираль', c['спираль'] != null ? String(c['спираль']) : '—'],
    // 25.09.2026, его слово: «пересечений угла» — простой счёт закрытий по другую сторону угла, не переходы цикла
    ['пересечений угла', c['переходы'] != null ? String(c['переходы']) : '—'],
  ];
  const sec = c['второй'];
  if (sec) {
    rows.push([
      'второй угол',
      `${sec['угол']} → ${num(sec['цель'], dg)}${(sec['цель_номер'] || 1) > 1 ? ` (цель №${sec['цель_номер']})` : ''}`,
    ]);
    rows.push(['зона синхронизации', c['зона'] ? `${num(c['зона'][0], dg)}–${num(c['зона'][1], dg)}` : 'не сложилась']);
  }
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
        <div style={{ ...label, marginTop: 6, color: ACCENT }}>
          цель взята{c['разворот'] ? ` · родился цикл в другую сторону от ${fmtDate(c['разворот'])}` : ''}
        </div>
      ) : c['отработан'] ? (
        <div style={{ ...label, marginTop: 6 }}>пройден 90%+ · цель не взята, цикл живой</div>
      ) : hpN ? (
        <div style={{ ...label, marginTop: 6 }}>цель взята, переходов нет — цикл идёт дальше полупериодами</div>
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
