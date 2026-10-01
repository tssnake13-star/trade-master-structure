import type { MarketRow } from './parts';

// Раскладка левого списка терминала: по группам и по сценариям. Только порядок и разбивка — правил системы
// здесь нет: группа, поводырь, сценарий, сторона и подтверждение приходят готовыми в строке инструмента.

// 21.09.2026, его порядок групп в левом списке: доллар, австралиец, йена, новозеландец,
// канадец, фунт, франк, золото, биткоин (нефть — после золота: группа есть, он её не назвал)
// 25.09.2026, его слово: «создать новую группу — группа без поводыря… туда нефть, туда S&P 500… и все
// инструменты, у которых нет поводырей, которых нет в других группах» — NONE, последней
// 29.09.2026, его слово: «группу йены поставь первой после доллара, ну то есть второй, потом идёт австралиец,
// новозеландец, фунт, канада, франк, золото, биткоин, ну и все остальные» — нефть и NONE после биткоина
export const GROUP_ORDER = ['DXY', 'JPY', 'AUD', 'NZD', 'GBP', 'CAD', 'CHF', 'GOLD', 'BTC', 'OIL', 'NONE'];
// 29.09.2026, его порядок внутри группы доллара: индекс, евро, фунт, австралиец, новозеландец, канада, франк, йена,
// сингапурский доллар, юань, золото. Внутри остальных групп — как было («не надо, вот как я сказал»)
export const DXY_ORDER = ['DXY', 'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY', 'USDSGD', 'USDCNH', 'XAUUSD'];

/**
 * Левый список по группам (21.09.2026). Поводырь стоит в группе, которую ведёт, и первым.
 * Кросс — в группе своего поводыря, как в карточке: AUDNZD ведёт NZDUSD — группа
 * новозеландца, NZDJPY ведёт USDJPY — группа йены (скринер держит их в двух группах).
 * У кого поводырь индекс доллара — группа из скринера: EURUSD в долларе, эфир у биткоина.
 * Его слово 21.09.2026: в группу доллара входят и все поводыри, кроме нефти, — поводырь
 * с долларом в имени стоит и там, и первым в своей группе. 23.09.2026, его слово: биткоина
 * в группе доллара быть не должно — он только первым в группе биткоина.
 * rows — все строки (кто кого ведёт), list — те, что показываем (после поиска).
 */
export function groupRows(rows: MarketRow[], list: MarketRow[]): [string, MarketRow[]][] {
  const norm = (s: string) => s.toUpperCase().replace(/USDT$/, 'USD');
  const leadOf: Record<string, string> = {};
  for (const r of rows) if (r.extra?.leads) leadOf[norm(r.symbol)] = r.extra.leads;
  const groupOf = (r: MarketRow) => {
    if (r.extra?.leads) return r.extra.leads;
    const lead = r.extra?.leader;
    if (lead && lead !== 'DXY' && leadOf[norm(lead)]) return leadOf[norm(lead)];
    return r.group_key || (lead === 'DXY' ? 'DXY' : 'NONE');
  };
  const by = new Map<string, MarketRow[]>();
  const put = (g: string, r: MarketRow) => by.set(g, [...(by.get(g) || []), r]);
  for (const r of list) {
    const g = groupOf(r);
    put(g, r);
    if (r.extra?.leads && g !== 'DXY' && g !== 'BTC' && r.symbol.toUpperCase().includes('USD')) put('DXY', r);
  }
  const pos = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i < 0 ? GROUP_ORDER.length : i;
  };
  // внутри группы: её поводырь, за ним поводыри других групп в порядке групп, потом пары по алфавиту;
  // у группы доллара — его порядок (DXY_ORDER), кого в нём нет — после, по тем же правилам
  const rank = (g: string, r: MarketRow) =>
    r.extra?.leads === g ? -1 : r.extra?.leads ? pos(r.extra.leads) : GROUP_ORDER.length + 1;
  const dxyAt = (r: MarketRow) => {
    const i = DXY_ORDER.indexOf(r.symbol.toUpperCase());
    return i < 0 ? DXY_ORDER.length : i;
  };
  return [...by.entries()]
    .sort((a, b) => pos(a[0]) - pos(b[0]))
    .map(([g, rs]): [string, MarketRow[]] => [
      g,
      [...rs].sort(
        (x, y) => (g === 'DXY' ? dxyAt(x) - dxyAt(y) : 0) || rank(g, x) - rank(g, y) || x.symbol.localeCompare(y.symbol),
      ),
    ]);
}

// ─────────────────────────── вид «сценарии» ───────────────────────────

export type ScenKey = '1' | '2' | 'ctx' | 'none';
export interface ScenBlock {
  key: ScenKey;
  total: number; // сколько инструментов в разделе всего — без оглядки на поиск
  long: number; // из них LONG и SHORT — тоже по всему разделу: шапка раздела от поиска не меняется
  short: number;
  rows: MarketRow[]; // что показываем: с подтверждением выше, внутри — LONG, потом SHORT, порядок бота
}

const scenOf = (r: MarketRow): ScenKey =>
  r.scenario === '1' || r.scenario === '2' ? r.scenario : r.scenario === 'итог' ? 'ctx' : 'none';

/** Инструменты по сценариям. Его порядок: из первого и второго сценария выше тот, где инструментов
 *  меньше; «по контексту» и «сценария нет» — после них. Порядок разделов считается по всем строкам,
 *  чтобы разделы не прыгали, пока набираешь поиск. */
export function scenarioRows(rows: MarketRow[], list: MarketRow[]): ScenBlock[] {
  const zero = (): Record<ScenKey, number> => ({ '1': 0, '2': 0, ctx: 0, none: 0 });
  const total = zero();
  const long = zero();
  const short = zero();
  for (const r of rows) {
    const k = scenOf(r);
    total[k] += 1;
    if (r.side === 'LONG') long[k] += 1;
    else if (r.side === 'SHORT') short[k] += 1;
  }
  const shown: Record<ScenKey, MarketRow[]> = { '1': [], '2': [], ctx: [], none: [] };
  for (const r of list) shown[scenOf(r)].push(r);
  const sideAt = (r: MarketRow) => (r.side === 'LONG' ? 0 : r.side === 'SHORT' ? 1 : 2);
  const numbered: ScenKey[] = total['2'] < total['1'] ? ['2', '1'] : ['1', '2'];
  return [...numbered, 'ctx' as const, 'none' as const].map((key) => ({
    key,
    total: total[key],
    long: long[key],
    short: short[key],
    rows: [...shown[key]].sort((a, b) => Number(!a.confirmation) - Number(!b.confirmation) || sideAt(a) - sideAt(b)),
  }));
}
