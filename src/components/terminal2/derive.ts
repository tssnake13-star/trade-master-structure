import { tradesOfResult, type FeedDocs, type Outcome, type Verdict } from '@/components/terminal/Feeds';
import type { MarketRow } from '@/components/terminal/parts';
import { parseScreener, type ScrGroup, type ScrTop } from '@/components/terminal/screenerParse';
import { fromBotTime } from '@/components/terminal/theme';
import { mondayOfSignal } from '@/lib/journalVideos';

/**
 * Приборы терминала v2 — только из того, что уже пришло из базы: журнал решений, итоги субботних разборов,
 * строки инструментов, скринер, время расчёта. Ни одной придуманной цифры: нет данных — прибор так и говорит.
 * Время везде по Астане (UTC+5) — его правило 16.10.2026 «по Астане лучше всегда писать».
 */

export const ASTANA_MS = 5 * 3600e3;
const p2 = (n: number) => String(n).padStart(2, '0');
const astana = (ms: number) => new Date(ms + ASTANA_MS);
export const msOf = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);

/** «29.10 03:05» по Астане */
export function fmtAst(iso: string | number | null | undefined, year = false): string {
  const ms = typeof iso === 'number' ? iso : msOf(iso);
  if (Number.isNaN(ms)) return '—';
  const d = astana(ms);
  return `${p2(d.getUTCDate())}.${p2(d.getUTCMonth() + 1)}${year ? `.${d.getUTCFullYear()}` : ''} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}
export const hhmmAst = (ms: number) => {
  const d = astana(ms);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
};
/** день по Астане: «2026-10-29» */
export const dayAst = (ms: number) => astana(ms).toISOString().slice(0, 10);
export const ddmm = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
const addDays = (day: string, k: number) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + k)).toISOString().slice(0, 10);
};
export const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};
export const fmtNum = (x: number, d = 1) => x.toFixed(d).replace('.', ',');
/** «+6,4 R», «−1 R», «0 R» */
export const fmtR = (v: number, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Number.isInteger(v) ? Math.abs(v) : fmtNum(Math.abs(v), d)} R`;

/* ---------------- свежесть данных — те же правила, что у строки свежести (components/terminal/Status.tsx) ----
   Полный круг раз в сутки, в 22:05 UTC (03:05 по Астане), круг идёт около 5 минут; первые 30 минут после отметки
   ждём ещё предыдущую. Скринер и журнал решений приходят сразу по его кнопкам. */
const SLOT_MS = 24 * 3600e3;
const SLOT_AT_MS = (22 * 60 + 5) * 60e3;
const RUN_MS = 30 * 60e3;
const lastSlot = (now: number) => Math.floor((now - SLOT_AT_MS) / SLOT_MS) * SLOT_MS + SLOT_AT_MS;

export type Tone = 'ok' | 'warn' | 'bad';
export function freshness(updatedAt: string | null | undefined, now: number): { tone: Tone; word: string; next: number } {
  const upd = msOf(updatedAt);
  const last = lastSlot(now);
  const expected = now - last < RUN_MS ? last - SLOT_MS : last;
  const next = last + SLOT_MS;
  if (Number.isNaN(upd)) return { tone: 'bad', word: 'данных нет', next };
  if (upd >= expected - 60e3) return { tone: 'ok', word: 'по графику', next };
  if (upd >= expected - SLOT_MS - 60e3) return { tone: 'warn', word: `задерживается, ждали в ${hhmmAst(expected)}`, next };
  const h = Math.floor((now - upd) / 3600e3);
  return { tone: 'bad', word: h >= 48 ? `нет обновлений ${Math.floor(h / 24)} дн` : `нет обновлений ${h} ч`, next };
}

/* ---------------- решения: допуски и отказы по дням ---------------- */
export interface DayCount {
  day: string; // ГГГГ-ММ-ДД по Астане (у недель — понедельник)
  label: string;
  ok: number;
  no: number;
  items: Verdict[];
}

/** Неделя по Астане, как у бота и журнала: понедельник — воскресенье */
export function weekOf(items: Verdict[], now: number): { monday: string; days: DayCount[]; ok: number; no: number } {
  const monday = mondayOfSignal(new Date(now).toISOString());
  const days: DayCount[] = WEEKDAYS.map((w, i) => ({ day: addDays(monday, i), label: w, ok: 0, no: 0, items: [] }));
  for (const v of items) {
    if (mondayOfSignal(v.time) !== monday) continue;
    const d = days.find((x) => x.day === dayAst(msOf(v.time)));
    if (!d) continue;
    d.items.push(v);
    if (v.verdict === 'ДОПУСК') d.ok += 1;
    else d.no += 1;
  }
  for (const d of days) d.items.sort((a, b) => b.time.localeCompare(a.time));
  return { monday, days, ok: days.reduce((s, d) => s + d.ok, 0), no: days.reduce((s, d) => s + d.no, 0) };
}

/** Последние n недель (включая текущую), по столбику на неделю */
export function weeksOf(items: Verdict[], now: number, n: number): DayCount[] {
  const cur = mondayOfSignal(new Date(now).toISOString());
  const weeks: DayCount[] = Array.from({ length: n }, (_, i) => {
    const day = addDays(cur, -7 * (n - 1 - i));
    return { day, label: ddmm(day), ok: 0, no: 0, items: [] };
  });
  const at = new Map(weeks.map((w) => [w.day, w]));
  for (const v of items) {
    const w = at.get(mondayOfSignal(v.time));
    if (!w) continue;
    w.items.push(v);
    if (v.verdict === 'ДОПУСК') w.ok += 1;
    else w.no += 1;
  }
  return weeks;
}

/* ---------------- итог решений в R: из записи итога каждой сделки (tradesOfResult) ----------------
   Итог берётся так же, как в календаре журнала: у решения из журнала — его итог из субботнего разбора
   (по времени сигнала, инструменту и стороне). Итог без решения в журнале не считается — у пробного доступа
   свежие решения скрыты, и их итоги на приборе не появляются. */
export interface RPoint {
  time: string;
  instrument: string;
  side: string;
  r: number;
  cum: number;
  result: string;
}
const outKey = (time: string, instrument: string, side: string) => `${new Date(time).getTime()}|${instrument}|${side}`;

export function rSeries(verdicts: Verdict[], outcomes: Outcome[] | undefined): RPoint[] {
  const known = new Set(verdicts.map((v) => outKey(v.time, v.instrument, v.side)));
  const list = (outcomes || []).filter((o) => known.has(outKey(o.time, o.instrument, o.side))).sort((a, b) => a.time.localeCompare(b.time));
  const out: RPoint[] = [];
  let cum = 0;
  for (const o of list) {
    for (const r of tradesOfResult(o.result)) {
      cum += r;
      out.push({ time: o.time, instrument: o.instrument, side: o.side, r, cum: Math.round(cum * 100) / 100, result: o.result || '' });
    }
  }
  return out;
}

export interface RStats {
  trades: number;
  total: number;
  plus: number;
  minus: number;
  wins: number;
  losses: number;
  avgWin: number;
  avgLoss: number;
}
export function rStats(points: RPoint[]): RStats {
  let plus = 0, minus = 0, wins = 0, losses = 0;
  for (const p of points) {
    if (p.r > 0) { plus += p.r; wins += 1; } else if (p.r < 0) { minus -= p.r; losses += 1; }
  }
  return {
    trades: points.length,
    total: Math.round((plus - minus) * 100) / 100,
    plus: Math.round(plus * 100) / 100,
    minus: Math.round(minus * 100) / 100,
    wins,
    losses,
    avgWin: wins ? plus / wins : 0,
    avgLoss: losses ? minus / losses : 0,
  };
}
/** точки за последние days дней по Астане; cum считается заново от начала окна */
export function rWindow(points: RPoint[], now: number, days: number | null): RPoint[] {
  const from = days == null ? '' : dayAst(now - days * 86400e3);
  let cum = 0;
  return points
    .filter((p) => dayAst(msOf(p.time)) >= from)
    .map((p) => {
      cum += p.r;
      return { ...p, cum: Math.round(cum * 100) / 100 };
    });
}

/* ---------------- пары в направлении: неделя и дневка смотрят в одну сторону ----------------
   Те же стрелки, что у списка инструментов (CritMarks): неделя снята аномальной свечой — направления недели нет. */
export type Dir = 'LONG' | 'SHORT' | null;
const dir3 = (d: string | null | undefined): Dir => (d === 'LONG' || d === 'UP' ? 'LONG' : d === 'SHORT' || d === 'DOWN' ? 'SHORT' : null);
export interface DirCell {
  r: MarketRow;
  w: Dir;
  d: Dir;
  agree: Dir; // общее направление недели и дневки
}
export function dirCells(rows: MarketRow[]): DirCell[] {
  return rows.map((r) => {
    const w = r.extra?.w_anom ? null : dir3(r.w_dir);
    const d = dir3(r.d_dir);
    return { r, w, d, agree: w && d && w === d ? w : null };
  });
}

/* ---------------- скринер ---------------- */
export interface ScrStats {
  at: string | null;
  groups: ScrGroup[];
  top: ScrTop[];
  up: number;
  down: number;
  flat: number;
}
export function scrStats(doc: FeedDocs['screener']): ScrStats | null {
  if (!doc || (!doc.groups && !doc.top)) return null;
  const p = parseScreener(doc.groups, doc.top, doc.leaders);
  return {
    at: doc.at || fromBotTime(doc.time),
    groups: p.groups,
    top: p.top,
    up: p.groups.filter((g) => g.dir === 'up').length,
    down: p.groups.filter((g) => g.dir === 'down').length,
    flat: p.groups.filter((g) => g.dir === 'flat').length,
  };
}

/** Ключ решения — как у строки журнала */
export const verdictKey = (v: Verdict) => `${v.time}|${v.instrument}|${v.side}|${v.verdict}`;
