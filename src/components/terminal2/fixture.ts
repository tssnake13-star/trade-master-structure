import type { FeedDocs, Outcome, Verdict } from '@/components/terminal/Feeds';
import type { Cycle, MarketRow } from '@/components/terminal/parts';
import { mondayOfSignal } from '@/lib/journalVideos';
import type { TerminalData, TerminalSource } from './model';

/**
 * ДЕМО-ДАННЫЕ для превью терминала v2 (/school/terminal-preview), чтобы экран можно было посмотреть без входа.
 * Всё здесь написано руками и на экране подписано «демо-данные»: это не цены рынка, не решения Сергея и не итоги
 * его счёта. Время решений считается от текущей недели, чтобы приборы недели не стояли пустыми в любой день.
 */

const H = 3600e3;
const D = 24 * H;
const iso = (ms: number) => new Date(ms).toISOString();
/** понедельник текущей недели по Астане, 00:00 по Астане */
const mondayMs = (now: number) => new Date(`${mondayOfSignal(iso(now))}T00:00:00+05:00`).getTime();

const cyc = (o: Partial<Cycle>): Cycle => ({ 'угол': '2/1', 'спираль': 2, 'переходы': 1, ...o });

function row(p: Partial<MarketRow> & { symbol: string }): MarketRow {
  return {
    title: null, group_key: 'DXY', sort_order: 10, price: null, price_text: null, side: null, scenario: null, confirmation: false,
    guide: null, w_dir: null, w_n: null, d_dir: null, d_n: null, trend_w1: null, trend_d1: null, trend_total: null,
    cycle_w1: null, cycle_d1: null, card_lines: null, trend_lines: null, range_lines: null,
    chart_cycles: null, chart_trend: null, chart_all: null, extra: null, bars_at: null, updated_at: null,
    ...p,
  };
}

function rows(barsAt: string): MarketRow[] {
  const base = { bars_at: barsAt };
  return [
    row({ ...base, symbol: 'DXY', title: 'Индекс доллара', sort_order: 1, price_text: '99.12', side: 'SHORT', scenario: '1', confirmation: true, w_dir: 'SHORT', w_n: 3, d_dir: 'SHORT', d_n: 2, guide: 'индекс доллара · за SHORT', extra: { leads: 'DXY', c_dir: 'SHORT', c_n: 2, itog: { ok: true } }, trend_w1: 'накопление вниз', trend_d1: 'накопление вниз', card_lines: ['🌀 DXY — демо-карточка: так здесь выглядит текст карточки из бота.'] }),
    row({ ...base, symbol: 'EURUSD', title: 'Евро / доллар', sort_order: 2, price_text: '1.16420', side: 'LONG', scenario: '1', confirmation: true, w_dir: 'LONG', w_n: 3, d_dir: 'LONG', d_n: 3, guide: 'индекс доллара · за LONG', trend_w1: 'накопление вверх', trend_d1: 'накопление вверх', trend_total: 'неделя и дневка в одну сторону', extra: { leader: 'DXY', c_dir: 'LONG', c_n: 3, w_votes: [['свинг', 'UP'], ['свеча', 'UP'], ['накопления', 'UP']], d_votes: [['свинг', 'UP'], ['свеча', 'UP'], ['накопления', 'UP']], c_votes: [['свинг', 'UP'], ['свеча', 'UP'], ['реверс', 'UP']], zapas: { ok: true, a: '14.10' }, itog: { ok: true } }, cycle_w1: cyc({ 'якорь': 1.1402, 'дата': '2026-09-14', 'цель': 1.1838, 'средняя': 1.162, 'полтора': 1.1947, 'пройдено_всего': 55, 'сейчас': 55, 'запас_п': 196, 'запас_atr': 1.7 }), cycle_d1: cyc({ 'угол': '1/1', 'якорь': 1.1528, 'дата': '2026-10-21', 'цель': 1.1712, 'средняя': 1.162, 'полтора': 1.1758, 'пройдено_всего': 62, 'сейчас': 62, 'запас_п': 70, 'запас_atr': 1.1 }), card_lines: ['🌀 EURUSD — демо-карточка: так здесь выглядит текст карточки из бота.'], trend_lines: ['Демо: здесь строки накоплений из бота.'], range_lines: ['Демо: рейнджа нет.'] }),
    row({ ...base, symbol: 'GBPUSD', title: 'Фунт / доллар', sort_order: 3, price_text: '1.33870', side: 'LONG', scenario: '2', confirmation: false, w_dir: 'LONG', w_n: 2, d_dir: 'LONG', d_n: 2, guide: 'индекс доллара · за LONG', extra: { leader: 'DXY', c_dir: null, c_n: 1, itog: { ok: false, why: ['нет подтверждения на дневке'] } } }),
    row({ ...base, symbol: 'AUDUSD', title: 'Австралиец / доллар', sort_order: 4, price_text: '0.65910', side: 'LONG', scenario: '1', confirmation: true, w_dir: 'LONG', w_n: 2, d_dir: 'SHORT', d_n: 2, guide: 'индекс доллара · за LONG', extra: { leader: 'DXY', c_dir: 'LONG', c_n: 2, itog: { ok: false, why: ['дневка против недели'] } } }),
    row({ ...base, symbol: 'NZDUSD', title: 'Новозеландец / доллар', sort_order: 5, price_text: '0.57830', side: null, w_dir: 'MIXED', w_n: 1, d_dir: 'LONG', d_n: 2, extra: { leader: 'DXY' } }),
    row({ ...base, symbol: 'USDCAD', title: 'Доллар / канадец', sort_order: 6, price_text: '1.39620', side: 'SHORT', scenario: '1', confirmation: true, w_dir: 'SHORT', w_n: 3, d_dir: 'SHORT', d_n: 3, guide: 'индекс доллара · за SHORT', extra: { leader: 'DXY', c_dir: 'SHORT', c_n: 3, itog: { ok: true } } }),
    row({ ...base, symbol: 'XAUUSD', title: 'Золото', group_key: 'GOLD', sort_order: 7, price_text: '3990.40', side: 'LONG', scenario: '1', confirmation: true, w_dir: 'LONG', w_n: 3, d_dir: 'LONG', d_n: 2, guide: 'индекс доллара · за LONG', extra: { leader: 'DXY', c_dir: 'LONG', c_n: 2, itog: { ok: true } } }),
    row({ ...base, symbol: 'USDJPY', title: 'Доллар / йена', group_key: 'JPY', sort_order: 8, price_text: '152.640', side: 'LONG', scenario: '2', confirmation: true, w_dir: 'LONG', w_n: 2, d_dir: 'LONG', d_n: 3, guide: 'индекс доллара · за SHORT', extra: { leads: 'JPY', c_dir: 'LONG', c_n: 2, itog: { ok: true } } }),
    row({ ...base, symbol: 'GBPJPY', title: 'Фунт / йена', group_key: 'JPY', sort_order: 9, price_text: '204.310', side: 'LONG', scenario: null, confirmation: false, w_dir: 'LONG', w_n: 2, d_dir: 'MIXED', d_n: 1, guide: 'USDJPY · за LONG', extra: { leader: 'USDJPY' }, card_lines: ['🌀 GBPJPY — Сценария нет: демо-причина.'] }),
    row({ ...base, symbol: 'BTCUSDT', title: 'Биткоин', group_key: 'BTC', sort_order: 20, price_text: '112400.0', side: 'SHORT', scenario: '1', confirmation: false, w_dir: 'SHORT', w_n: 2, d_dir: 'SHORT', d_n: 2, extra: { leads: 'BTC', c_dir: null, c_n: 1 } }),
  ];
}

const SCREENER_GROUPS = [
  '📉 Группа доллара (DXY) → SELL · W1↓ [3/3] · D1↓ [2/3]',
  '📈 накопления у индекса доллара — в сторону группы',
  '→ EURUSD LONG 3/3, GBPUSD LONG 2/3, AUDUSD LONG 2/3, XAUUSD LONG 3/3, USDCAD SHORT 3/3',
  '📈 Группа йены (JPY) → BUY · W1↑ [2/3] · D1↑ [3/3]',
  '→ USDJPY LONG 2/3, GBPJPY LONG 2/3',
  '➖ Группа крипты (BTC) → MIXED · W1~ · D1↓ [2/3]',
  '→ BTCUSDt SHORT 2/3',
].join('\n');
const SCREENER_TOP = [
  '1. EURUSD LONG · сценарий 1',
  'W1 угол 2/1',
  'первый переход 05.10.2026 по 1.1530 · цель 1.1838',
  'пройдено 55% · запас 196 п (1.7 ATR)',
  'D1 угол 1/1',
  'второй переход 22.10.2026 по 1.1590 · цель 1.1712',
  'пройдено 62% · запас 70 п (1.1 ATR)',
  '📈 накопления — неделя и дневка в одну сторону',
  '2. USDCAD SHORT · сценарий 1',
  'W1 угол 1/1',
  'первый переход 12.10.2026 по 1.4010 · цель 1.3720',
  'пройдено 48% · запас 151 п (1.4 ATR)',
  'D1 угол 2/1',
  'первый переход 23.10.2026 по 1.3990 · цель 1.3880',
  'пройдено 30% · запас 74 п (1.2 ATR)',
  '3. XAUUSD LONG · сценарий 1',
  'W1 угол 1/1',
  'первый переход 06.10.2026 по 3810 · цель 4180',
  'пройдено 49% · запас 190 п (1.3 ATR)',
].join('\n');

type V = [number, string, 'LONG' | 'SHORT', Verdict['verdict'], string, string?];

/** Решения от понедельника текущей недели: [сдвиг в часах, инструмент, сторона, вердикт, почему, итог разбора] */
const PLAN: V[] = [
  [-29 * 24 + 10, 'EURUSD', 'LONG', 'ДОПУСК', 'Неделя и дневка вверх, подтверждение на дневке есть.', 'ВОШЁЛ · ТЕЙК 9,5 к 1'],
  [-28 * 24 + 14, 'AUDUSD', 'LONG', 'ОТКАЗ', 'Дневка против недели.', 'НЕ ВХОДИЛ'],
  [-27 * 24 + 9, 'USDCAD', 'SHORT', 'ДОПУСК', 'Все критерии сошлись, запас хода есть.', 'ВОШЁЛ · СТОП'],
  [-22 * 24 + 11, 'XAUUSD', 'LONG', 'ДОПУСК', 'Сценарий 1, подтверждение есть.', 'ВОШЁЛ · СТОП'],
  [-21 * 24 + 15, 'GBPJPY', 'LONG', 'ОТКАЗ', 'Сценария нет.', 'НЕ ВХОДИЛ'],
  [-20 * 24 + 10, 'USDJPY', 'LONG', 'ДОПУСК', 'Сценарий 2, поводырь поддерживает.', 'ВОШЁЛ · СТОП'],
  [-15 * 24 + 9, 'EURUSD', 'LONG', 'ДОПУСК', 'Неделя и дневка вверх.', 'ВОШЁЛ · ТЕЙК 7,2 к 1'],
  [-14 * 24 + 16, 'NZDUSD', 'LONG', 'ОТКАЗ', 'Неделя в споре.', 'НЕ ВХОДИЛ'],
  [-13 * 24 + 12, 'GBPUSD', 'LONG', 'ДОПУСК', 'Сценарий 2.', 'ВОШЁЛ · БЕЗУБЫТОК'],
  [-8 * 24 + 10, 'USDCAD', 'SHORT', 'ДОПУСК', 'Все критерии сошлись.', 'ВОШЁЛ · СТОП'],
  [-7 * 24 + 13, 'AUDUSD', 'LONG', 'ОТКАЗ', 'Нет подтверждения на дневке.', 'НЕ ВХОДИЛ'],
  [-6 * 24 + 9, 'XAUUSD', 'LONG', 'ДОПУСК', 'Сценарий 1.', 'ВОШЁЛ · ТЕЙК 10,8 к 1'],
  [0 * 24 + 10, 'EURUSD', 'LONG', 'ДОПУСК', 'Неделя и дневка вверх, подтверждение есть.'],
  [0 * 24 + 15, 'GBPJPY', 'LONG', 'ОТКАЗ', 'Сценария нет.'],
  [1 * 24 + 11, 'USDJPY', 'LONG', 'ОТКАЗ', 'Запаса хода нет: хай переписан.'],
  [2 * 24 + 9, 'USDCAD', 'SHORT', 'ДОПУСК', 'Все критерии сошлись.'],
  [3 * 24 + 12, 'AUDUSD', 'LONG', 'ОТКАЗ', 'Дневка против недели.'],
];

export type DemoMode = 'sub' | 'trial' | 'admin';

export function demoData(mode: DemoMode, now: number, extra: Verdict[] = []): TerminalData {
  const mon = mondayMs(now);
  const all: Verdict[] = PLAN.map(([h, instrument, side, verdict, reason]): Verdict => ({
    time: iso(mon + h * H),
    instrument,
    side,
    verdict,
    reason,
    scenario: '1',
  }))
    .filter((v) => new Date(v.time).getTime() <= now)
    .concat(extra)
    .sort((a, b) => b.time.localeCompare(a.time));
  const outcomes: Outcome[] = PLAN.filter((p) => p[5]).map(([h, instrument, side, , , result]) => ({ time: iso(mon + h * H), instrument, side, result, text: 'Демо: что было дальше.' }));
  // расчёт — в 03:05 по Астане сегодня (или вчера, если сейчас раньше)
  const slot = new Date(`${new Date(now + 5 * H).toISOString().slice(0, 10)}T03:05:00+05:00`).getTime();
  const updated = slot <= now ? slot : slot - D;
  const barsAt = iso(updated - 3 * H);
  let list = rows(barsAt);
  const feeds: FeedDocs = {
    verdicts: { items: all },
    outcomes: { items: outcomes },
    screener: { at: iso(updated + 6 * H < now ? updated + 6 * H : updated + 5 * 60e3), groups: SCREENER_GROUPS, top: SCREENER_TOP },
  };
  let hidden: string[] = [];
  let locked: { symbol: string; title: string | null }[] = [];
  if (mode === 'trial') {
    // пробному: журнал с задержкой 3 дня, скринера нет, открыты несколько инструментов
    const cut = now - 3 * D;
    hidden = all.filter((v) => new Date(v.time).getTime() > cut).map((v) => v.time);
    feeds.verdicts = { items: all.filter((v) => new Date(v.time).getTime() <= cut) };
    delete feeds.screener;
    const open = new Set(['EURUSD', 'GBPUSD', 'AUDUSD']);
    locked = list.filter((r) => !open.has(r.symbol)).map((r) => ({ symbol: r.symbol, title: r.title }));
    list = list.filter((r) => open.has(r.symbol));
  }
  if (mode === 'admin') {
    feeds.trend = { lines: ['Демо: список тренда по накоплениям.', 'EURUSD — неделя и дневка вверх', 'USDCAD — неделя и дневка вниз'] };
    feeds.falsex = { checked: list.length, items: [{ instrument: 'AUDUSD', state: 'ложный', hdir: 'вниз', text: 'демо: хвост за уровень против недели, закрытие вернулось', date: '27.10', age: 0 }] };
    feeds.verdicts_crypto = { items: [] };
  }
  return {
    rows: list,
    feeds,
    feedAt: { verdicts: all[0]?.time || null, outcomes: iso(mon - 2 * D + 12 * H), screener: feeds.screener?.at || null },
    videos: [],
    meta: { updated_at: iso(updated), bars_at: barsAt, build: 'demo' },
    until: iso(now + (mode === 'trial' ? 5 : 40) * D),
    trial: mode === 'trial',
    lockedList: locked,
    hiddenVerdicts: hidden,
  };
}

/** Демо: графиков и картинок нет, ящик и база не спрашиваются */
export const demoSource: TerminalSource = {
  chartUrl: () => Promise.resolve(null),
  scene: () => Promise.resolve(null),
  timeMachine: () => Promise.resolve({ items: [] }),
  picUrl: (p) => p,
};

/** «Прислать решение (демо)»: как приходит новое решение, пока экран открыт */
export const demoVerdict = (now: number, n: number): Verdict => {
  const pick = [
    ['XAUUSD', 'LONG', 'ДОПУСК', 'Демо: сценарий 1, подтверждение есть.'],
    ['GBPUSD', 'LONG', 'ОТКАЗ', 'Демо: нет подтверждения на дневке.'],
    ['USDCAD', 'SHORT', 'ДОПУСК', 'Демо: все критерии сошлись.'],
  ][n % 3] as [string, string, Verdict['verdict'], string];
  return { time: iso(now), instrument: pick[0], side: pick[1], verdict: pick[2], reason: pick[3], scenario: '1' };
};
