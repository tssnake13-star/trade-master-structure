import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mondayOfSignal, type JournalVideo } from '@/lib/journalVideos';
import { ACCENT, DIM, DOWN, FG, MONO, UP, BORDER, card, label, fmtWhen, fromBotTime, pill, marketOfSym, type MarketKey } from './theme';
import type { HistoryDoc } from './History';
import { VideoReviews, WeekHeader } from './Reviews';
import type { TimeItem } from './TimeMachine';

/**
 * Ленты терминала: скринер, тренд по накоплениям, резонанс, решения владельца.
 * Текст — ровно тот, что подписчик получает в боте; экран только делает
 * инструменты в нём нажимаемыми, чтобы сразу открыть разбор.
 */

export interface FeedDocs {
  // at — время скринера с поясом (мост с 22.09.2026); time — строка бота по часам VPS
  screener?: { time?: string | null; at?: string | null; groups?: string | null; top?: string | null; leaders?: Record<string, string> | null };
  trend?: { lines?: string[] };
  // 18.10.2026: crypto_private — крипта «только ему» (/crypto me): подписчику журнал крипты под замком;
  // verdicts_crypto — его решения по крипте в этом режиме, лента только администратору
  verdicts?: { items?: Verdict[]; crypto_private?: boolean };
  verdicts_crypto?: { items?: Verdict[] };
  falsex?: { checked?: number; items?: FalseExit[] };
  // 25.09.2026: итоги решений из его субботнего разбора (таблица допусков) — кладутся раз в неделю
  outcomes?: { items?: Outcome[] };
  // 25.09.2026: история направления — мост пишет каждый полный круг
  history?: HistoryDoc;
  // 18.10.2026: «Машина времени» и «Тренажёр» — кладёт субботний terminal_ishody.py
  timemachine?: { items?: TimeItem[] };
}

/** 25.09.2026, его слово: «Почему я решил и что случилось после моего решения?» — итог его решения
 *  из еженедельного разбора «Допуск · отказ» (таблица допусков, которую заполняем по субботам) и куда
 *  пошла цена после сигнала — тем же мерилом, что в субботней сводке: 2 средних дневных хода. */
export interface Outcome {
  time: string;
  instrument: string;
  side: string;
  result?: string; // «ВОШЁЛ · СТОП», «ОТМЕНИЛ», «НЕ ВХОДИЛ»…
  text?: string; // что было дальше — его словами
  price?: { status: string; fav?: number | null; adv?: number | null; at?: string } | null;
}

export interface FalseExit {
  instrument: string;
  state: 'ложный' | 'разворот' | 'отменён';
  hdir: 'вверх' | 'вниз';
  text: string;
  date?: string; // 23.09.2026: свеча события и её возраст в дневках
  age?: number;
}

export interface Verdict {
  time: string;
  instrument: string;
  side: string;
  scenario: string;
  verdict: 'ДОПУСК' | 'ОТКАЗ';
  both_layers?: boolean;
  reason?: string;
  pic?: string | null; // 24.09.2026: картинка H4 решения в закрытом ящике terminal (verdicts/…webp)
}

type Open = (symbol: string) => void;

/** 18.10.2026, его слово: «как отделить журнал по форексу и журнал крипты… давай с переключателем, делай везде». */
export function MarketSwitch({ value, onChange, counts, locked }: { value: MarketKey; onChange: (m: MarketKey) => void; counts: Record<MarketKey, number>; locked?: MarketKey }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {(['fx', 'crypto'] as MarketKey[]).map((m) => (
        <button key={m} onClick={() => onChange(m)} style={pill(value === m)}>
          {m === 'fx' ? 'Форекс' : 'Крипта'} · {locked === m ? '🔒' : counts[m]}
        </button>
      ))}
    </div>
  );
}

/** Текст бота, где каждый знакомый инструмент — кнопка. Слова вроде W1, D1,
 *  LONG не трогаем: нажимается только то, что есть в списке терминала. */
export function Linked({ text, symbols, onOpen }: { text: string; symbols: Set<string>; onOpen: Open }) {
  const out: ReactNode[] = [];
  const re = /[A-Z][A-Z0-9_]{2,}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    const sym = m[0];
    if (!symbols.has(sym)) continue;
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    out.push(
      <button
        key={k++}
        onClick={() => onOpen(sym)}
        style={{ color: ACCENT, fontFamily: MONO, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        {sym}
      </button>,
    );
    last = m.index + sym.length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

function TextBlock({ text, symbols, onOpen }: { text: string; symbols: Set<string>; onOpen: Open }) {
  return (
    <div style={{ whiteSpace: 'pre-wrap', color: FG, fontSize: 13, lineHeight: 1.65 }}>
      <Linked text={text} symbols={symbols} onOpen={onOpen} />
    </div>
  );
}

function Empty({ what }: { what: string }) {
  return <div style={{ color: DIM, fontSize: 13, padding: 20 }}>{what} пока нет — появится после ближайшего расчёта.</div>;
}

export function ScreenerFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['screener']; symbols: Set<string>; onOpen: Open }) {
  if (!doc || (!doc.groups && !doc.top)) return <Empty what="Одобренного скринера" />;
  return (
    <div>
      <div style={{ ...label, marginBottom: 12 }}>скринер от {fmtWhen(doc.at || fromBotTime(doc.time))} · одобрен автором</div>
      {doc.groups ? (
        <div style={{ ...card, padding: 14, marginBottom: 14 }}>
          <TextBlock text={doc.groups} symbols={symbols} onOpen={onOpen} />
        </div>
      ) : null}
      {doc.top ? (
        <div style={{ ...card, padding: 14 }}>
          <TextBlock text={doc.top} symbols={symbols} onOpen={onOpen} />
        </div>
      ) : null}
    </div>
  );
}

export function TrendFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['trend']; symbols: Set<string>; onOpen: Open }) {
  const lines = doc?.lines || [];
  if (!lines.length) return <Empty what="Списка тренда" />;
  return (
    <div style={{ ...card, padding: 14 }}>
      <TextBlock text={lines.join('\n')} symbols={symbols} onOpen={onOpen} />
    </div>
  );
}

/** Просто выход против недели (до 23.09.2026 — «ложный выход»): дневка вышла хвостом за
 *  предварительный уровень против тренда недели, закрытие вернулось. Тот же список, что бот присылает
 *  каждое утро (kontekst_svecha.false_exit_scan). Вкладка — только админу (его слово 23.09.2026). */
export function FalseExitFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['falsex']; symbols: Set<string>; onOpen: Open }) {
  if (!doc) return <Empty what="Списка выходов против недели" />;
  // 23.09.2026 вечер, его «верни оба»: просто выход, выход через зону выхода (разворот) и отмена выхода
  const items = (doc.items || []).filter((i) => i.state === 'ложный' || i.state === 'разворот' || i.state === 'отменён');
  // кружок — куда смотрит событие: у простого выхода и отмены неделя, у выхода через зону — сам выход
  const up = (i: FalseExit) => (i.state === 'разворот' ? i.hdir !== 'вверх' : i.hdir === 'вверх');
  const work = items.filter((i) => !i.age);
  const back = items.filter((i) => (i.age || 0) > 0);
  const row = (i: FalseExit) => (
    <div key={i.instrument} style={{ ...card, padding: 12, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <span style={{ color: up(i) ? UP : DOWN }}>{up(i) ? '🟢' : '🔴'}</span>
      <span style={{ fontFamily: MONO, fontSize: 14, color: FG }}>{i.instrument}</span>
      <span style={{ color: FG, fontSize: 13 }}>{i.text}</span>
      {i.date ? <span style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>{i.date}</span> : null}
      {symbols.has(i.instrument) ? (
        <button
          onClick={() => onOpen(i.instrument)}
          style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer' }}
        >
          открыть разбор
        </button>
      ) : null}
    </div>
  );
  return (
    <div>
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Дневка против тренда недели: просто выход (хвост за предварительным уровнем, закрытие вернулось), выход через зону выхода (разворот) и отмена выхода (цена вернулась). Список обновляется каждое утро после закрытия дневки. Информация, не запрет.
      </div>
      {doc.checked === 0 ? (
        <div style={{ color: DIM, fontSize: 13 }}>Свечей не было — проверить не удалось.</div>
      ) : !items.length ? (
        <div style={{ color: DIM, fontSize: 13 }}>За последние дни выходов против недели нет.</div>
      ) : null}
      {work.length ? (
        <>
          <div style={{ ...label, margin: '6px 0 8px' }}>новые — последняя закрытая дневка</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{work.map(row)}</div>
        </>
      ) : null}
      {back.length ? (
        <>
          <div style={{ ...label, margin: '6px 0 8px' }}>за последние дни</div>
          <div style={{ display: 'grid', gap: 8 }}>{back.map(row)}</div>
        </>
      ) : null}
    </div>
  );
}

// итог решения: тейк — зелёным, стоп — красным, сделка в работе — золотом, остальное (не входил,
// отменил, безубыток) — серым
const resultColor = (r: string) =>
  /ТЕЙК/.test(r) ? UP : /СТОП/.test(r) ? DOWN : /В РАБОТЕ/.test(r) ? ACCENT : DIM;

// всегда один знак после запятой: «1,0 дневного хода», а не «1 дневного хода»
const num = (x: number | null | undefined) => (x == null ? '—' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ','));

function priceWords(p: NonNullable<Outcome['price']>) {
  const head =
    p.status === 'против'
      ? 'цена первой прошла 2 дневных хода против сигнала'
      : p.status === 'по сигналу'
        ? 'цена первой прошла 2 дневных хода в сторону сигнала'
        : 'цена пока не прошла 2 дневных хода ни в одну сторону';
  const at = p.at ? ` · на ${fmtWhen(p.at).slice(0, 5)}` : '';
  return `${head} · дальше всего: по сигналу ${num(p.fav)}, против ${num(p.adv)} дневного хода${at}`;
}

const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};

/** 18.10.2026, его слово: «винрейт 23%… если человек начнёт проверять, он будет смотреть только стопы. Как это может
 *  продавать?» и следом «убери октябрь, потому что он ещё не закончен… июль, август и сентябрь… итоги трёх месяцев».
 *  Источник — таблица счёта TLT_Statement_2025-2026, лист «Помесячно» (риск 0,25% на сделку): июль и август из копии
 *  05.09 (закрытые месяцы, со срезом 04.10 сходятся: 87 побед, +136,0%), сентябрь — срез 04.10.2026. Риск = % / 0,25.
 *  ⚠️ Когда закроется следующий месяц — взять его из таблицы и сдвинуть окно (три последних закрытых месяца). */
const STATEMENT_MONTHS: { name: string; trades: number; wins: number; pct: number }[] = [
  { name: 'Сентябрь 2026', trades: 10, wins: 3, pct: 7.48 },
  { name: 'Август 2026', trades: 23, wins: 5, pct: 10.2 },
  { name: 'Июль 2026', trades: 22, wins: 5, pct: 6.23 },
];
const fmtNum = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/** 19.10.2026, его выбор «вариант Б… под ним вариант В»: квадрат — сделка, площадь — результат. Стоп — маленький
 *  красный (1), тейк — большой зелёный: средний тейк месяца = (итог месяца в стопах + число стопов) / число тейков —
 *  у таблицы счёта нет размера каждой сделки. Красных много, но вся красная полоса меньше одного зелёного. */
function MonthTotals() {
  const U = 9;
  return (
    <div style={{ ...card, padding: 12, marginBottom: 12 }}>
      <div style={{ ...label, marginBottom: 8 }}>Мой счёт: итог последних трёх месяцев</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: FG, marginBottom: 12, padding: '8px 10px', borderLeft: `3px solid ${ACCENT}`, background: `${ACCENT}10`, borderRadius: 6 }}>
        Прибыльных сделок у меня около 1 из 4. Зато прибыльная в среднем в 9,5 раза больше убыточной, поэтому месяц закрывается в плюсе.
      </div>
      {STATEMENT_MONTHS.map((m) => {
        const R = m.pct / 0.25;
        const loss = m.trades - m.wins;
        const avg = (R + loss) / m.wins;
        const side = Math.round(Math.sqrt(avg) * U);
        return (
          <div key={m.name} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <b style={{ fontSize: 13, color: FG }}>{m.name}</b>
              <span style={{ fontFamily: MONO, fontSize: 12, color: UP }}>
                +{fmtNum(m.pct, 2)}% · ×{fmtNum(R)}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-end' }}>
              {Array.from({ length: m.wins }, (_, i) => (
                <span key={'g' + i} style={{ width: side, height: side, borderRadius: 4, background: UP }} />
              ))}
              {Array.from({ length: loss }, (_, i) => (
                <span key={'r' + i} style={{ width: U, height: U, borderRadius: 2, background: DOWN }} />
              ))}
            </div>
            <div style={{ color: DIM, fontSize: 11.5, marginTop: 4 }}>
              {loss} {plural(loss, 'стоп', 'стопа', 'стопов')} по 1 · {m.wins} {plural(m.wins, 'тейк', 'тейка', 'тейков')}, в среднем по {fmtNum(avg)}
            </div>
          </div>
        );
      })}
      <div style={{ color: DIM, fontSize: 12, lineHeight: 1.5, marginTop: 2 }}>
        Квадрат — сделка, его площадь — результат: стоп забирает 0,25% счёта, тейк приносит в разы больше. ×29,9 значит: за месяц заработано в 29,9 раза больше, чем забирает один стоп. Бывают и месяцы в минус: из 21 месяца так закрылись 3. Прошлый результат не гарантирует будущий.
      </div>
    </div>
  );
}

/** Итог сделки в стопах из его записи итога: «ТЕЙК 10,8 к 1» → +10,8 · «−5,3 R» → −5,3 · «СТОП» → −1 ·
 *  «БЕЗУБЫТОК», «≈ 0» → 0. Не входил, отменил, в работе — null. */
function rOfResult(r?: string): number | null {
  if (!r || !/ВОШЁЛ/.test(r) || /В РАБОТЕ|ЖДЁТ/.test(r)) return null;
  const n = (x: string) => parseFloat(x.replace(',', '.'));
  const tp = r.match(/ТЕЙК\s+([\d,.]+)\s*к\s*1/);
  if (tp) return n(tp[1]);
  const rr = r.match(/([−-])\s*([\d,.]+)\s*R/);
  if (rr) return -n(rr[2]);
  if (/БЕЗУБЫТОК|≈\s*0/.test(r)) return 0;
  const st = r.match(/(\d+)\s*СТОП/);
  if (st) return -parseInt(st[1], 10);
  if (/СТОП/.test(r)) return -1;
  return null;
}

// день решения по его времени (UTC+5), как неделя в журнале
const dayOf = (time: string) => new Date(new Date(time).getTime() + 5 * 3600e3).toISOString().slice(0, 10);
const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const JOURNAL_FROM = '2026-09'; // журнал нажатий его кнопок начинается 09.09.2026; раньше решения не публиковались

/** 19.10.2026, его слово: «календарь текущего месяца… чтобы можно было пролистать… с сентября… нажать на квадратик
 *  сделки и сразу перейти к решению в списке». День окрашен по итогу его решений: тейк — зелёный, стоп — красный,
 *  безубыток — серый, решения без входа или ещё без итога — рамкой. Нажатие — к первому решению дня в списке. */
function JournalCalendar({ items, outOf, onPick }: { items: Verdict[]; outOf: (v: Verdict) => Outcome | undefined; onPick: (day: string) => void }) {
  const now = dayOf(new Date().toISOString()).slice(0, 7);
  const [ym, setYm] = useState(now);
  const shift = (k: number) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + k, 1));
    const next = d.toISOString().slice(0, 7);
    if (next >= JOURNAL_FROM && next <= now) setYm(next);
  };
  const by = new Map<string, { r: number | null; n: number }>();
  for (const v of items) {
    const d = dayOf(v.time);
    if (!d.startsWith(ym)) continue;
    const cur = by.get(d) || { r: null, n: 0 };
    const r = rOfResult(outOf(v)?.result);
    cur.n += 1;
    if (r != null) cur.r = (cur.r ?? 0) + r;
    by.set(d, cur);
  }
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const off = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  let sum = 0, take = 0, stop = 0;
  for (const x of by.values()) if (x.r != null) { sum += x.r; if (x.r > 0) take += 1; else if (x.r < 0) stop += 1; }
  const arrow = (k: number, dis: boolean) => (
    <button onClick={() => shift(k)} disabled={dis} style={{ ...pill(false), padding: '4px 12px', opacity: dis ? 0.3 : 1, cursor: dis ? 'default' : 'pointer' }}>
      {k < 0 ? '←' : '→'}
    </button>
  );
  return (
    <div style={{ ...card, padding: 12, marginBottom: 12 }}>
      <div style={{ ...label, marginBottom: 8 }}>Календарь решений</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        {arrow(-1, ym <= JOURNAL_FROM)}
        <div style={{ textAlign: 'center' }}>
          <b style={{ fontSize: 14, color: FG }}>{MONTH_NAMES[m - 1]} {y}</b>
          <div style={{ fontFamily: MONO, fontSize: 11, color: sum > 0 ? UP : sum < 0 ? DOWN : DIM }}>
            {take || stop ? `${sum > 0 ? '+' : sum < 0 ? '−' : ''}${fmtNum(Math.abs(sum))} · тейков ${take}, стопов ${stop}` : 'итогов пока нет'}
          </div>
        </div>
        {arrow(1, ym >= now)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <div key={d} style={{ fontFamily: MONO, fontSize: 10, color: DIM, textAlign: 'center' }}>{d}</div>
        ))}
        {Array.from({ length: off }, (_, i) => <div key={'e' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = `${ym}-${String(i + 1).padStart(2, '0')}`;
          const x = by.get(key);
          const bg = !x ? '#1a1815' : x.r == null ? '#1a1815' : x.r > 0 ? UP : x.r < 0 ? DOWN : '#4a453e';
          const fg = x && x.r != null && x.r !== 0 ? '#0a0a0a' : x ? FG : '#5d574e';
          const lab = x && x.r != null ? `${x.r > 0 ? '+' : x.r < 0 ? '−' : ''}${Number.isInteger(x.r) ? Math.abs(x.r) : fmtNum(Math.abs(x.r))}` : '';
          return (
            <button
              key={key}
              disabled={!x}
              onClick={() => x && onPick(key)}
              title={x ? `${x.n} ${plural(x.n, 'решение', 'решения', 'решений')} — открыть в списке` : undefined}
              style={{
                aspectRatio: '1', borderRadius: 6, border: 'none', background: bg, color: fg, position: 'relative', padding: 3,
                textAlign: 'left', fontSize: 10, cursor: x ? 'pointer' : 'default',
                boxShadow: x && x.r == null ? 'inset 0 0 0 2px #5b544a' : undefined,
              }}
            >
              <span style={{ position: 'absolute', top: 3, left: 4 }}>{i + 1}</span>
              {lab ? <span style={{ position: 'absolute', bottom: 3, right: 4, fontFamily: MONO, fontWeight: 700, fontSize: 11 }}>{lab}</span> : null}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11.5, color: DIM, marginTop: 8 }}>
        {[[UP, 'тейк'], [DOWN, 'стоп'], ['#4a453e', 'безубыток']].map(([c, n]) => (
          <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i style={{ width: 11, height: 11, borderRadius: 3, background: c, display: 'inline-block' }} />
            {n}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <i style={{ width: 11, height: 11, borderRadius: 3, boxShadow: 'inset 0 0 0 2px #5b544a', display: 'inline-block' }} />
          без входа или итог позже
        </span>
      </div>
      <div style={{ color: DIM, fontSize: 11.5, marginTop: 6 }}>Число в клетке — итог дня в стопах. Нажмите на день — откроются решения этого дня в списке.</div>
    </div>
  );
}

function OutcomeBlock({ o }: { o?: Outcome }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ ...label, marginBottom: 6 }}>Что было дальше</div>
      {o ? (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
            {o.result ? (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  padding: '2px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  color: resultColor(o.result),
                  border: `1px solid ${resultColor(o.result)}55`,
                }}
              >
                {o.result}
              </span>
            ) : null}
            {o.text ? <span style={{ color: FG, fontSize: 13, lineHeight: 1.6 }}>{o.text}</span> : null}
          </div>
          {o.price ? (
            <div
              title="Средний дневной ход — сколько пара в среднем проходила за день в 10 дней до сигнала"
              style={{ color: DIM, fontSize: 12, lineHeight: 1.5, marginTop: 6 }}
            >
              {priceWords(o.price)}
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ color: DIM, fontSize: 12 }}>итог — после разбора недели</div>
      )}
    </div>
  );
}

// 18.10.2026: picUrl — терминал в Телеграме берёт картинки из открытого ящика tgpub, а не по подписанной ссылке
export function VerdictsFeed({ doc, outcomes, videos = [], symbols, onOpen, picUrl, privateCrypto }: { doc?: FeedDocs['verdicts']; outcomes?: FeedDocs['outcomes']; videos?: JournalVideo[]; symbols: Set<string>; onOpen: Open; picUrl?: (path: string) => string; privateCrypto?: FeedDocs['verdicts_crypto'] }) {
  // 18.10.2026: администратору — и его решения по крипте «только мне» (privateCrypto); подписчику в этом режиме
  // журнал крипты под замком
  const all = [...(doc?.items || []), ...(privateCrypto?.items || [])].sort((a, b) => b.time.localeCompare(a.time));
  const cryptoLocked = !!doc?.crypto_private && !privateCrypto;
  const [mk, setMk] = useState<MarketKey>('fx');
  const items = cryptoLocked && mk === 'crypto' ? [] : all.filter((v) => marketOfSym(v.instrument) === mk);
  const counts = { fx: all.filter((v) => marketOfSym(v.instrument) === 'fx').length, crypto: all.filter((v) => marketOfSym(v.instrument) === 'crypto').length };
  // 25.09.2026: серии «Допуск-отказ» — плеер сверху; «разбор этой недели» у карточек включает серию в нём
  const [vid, setVid] = useState<string | null>(null);
  // 19.10.2026: день, выбранный в календаре, — его решения в списке подсвечены пару секунд
  const [flash, setFlash] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const videoOf = new Map(videos.map((x) => [x.week, x]));
  const play = (id: string) => {
    setVid(id);
    box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // итог решения ищем по времени сигнала, инструменту и стороне — как строка журнала
  const outKey = (time: string, instrument: string, side: string) => `${new Date(time).getTime()}|${instrument}|${side}`;
  const outOf = new Map((outcomes?.items || []).map((o) => [outKey(o.time, o.instrument, o.side), o]));
  // 24.09.2026, его слово: «в журнале допусков должна быть H4 картинка — инструмент, направление,
  // допуск, картинка, почему беру». Картинки лежат в закрытом ящике: ссылки одним запросом, живут час.
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [full, setFull] = useState<string | null>(null);
  const picKey = items.map((v) => v.pic || '').join('|');
  useEffect(() => {
    const paths = picKey.split('|').filter(Boolean);
    if (!paths.length) return;
    if (picUrl) {
      setUrls(Object.fromEntries(paths.map((p) => [p, picUrl(p)])));
      return;
    }
    let alive = true;
    supabase.storage
      .from('terminal')
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (!alive || !data) return;
        const m: Record<string, string> = {};
        data.forEach((d) => {
          if (d.path && d.signedUrl) m[d.path] = d.signedUrl;
        });
        setUrls(m);
      });
    return () => {
      alive = false;
    };
  }, [picKey]);
  if (!all.length) return <Empty what="Записей в журнале решений" />;
  const oldest = items[items.length - 1]?.time;
  return (
    <div>
      <MarketSwitch value={mk} onChange={setMk} counts={counts} locked={cryptoLocked ? 'crypto' : undefined} />
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Допуски и отказы автора, которые получили подписчики{oldest ? `, с ${fmtWhen(oldest).slice(0, 10)}` : ''}. Свежие сверху, хранятся последние 90 дней. Время — по вашему часовому поясу. Под каждым решением — что было дальше: итог из еженедельного разбора и куда пошла цена после сигнала.
      </div>
      <MonthTotals />
      <JournalCalendar
        items={items}
        outOf={(v) => outOf.get(outKey(v.time, v.instrument, v.side))}
        onPick={(day) => {
          const el = document.querySelector(`[data-day="${day}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setFlash(day);
          window.setTimeout(() => setFlash((f) => (f === day ? null : f)), 2600);
        }}
      />
      {videos.length ? <VideoReviews videos={videos} currentId={vid} onPick={setVid} boxRef={box} /> : null}
      {cryptoLocked && mk === 'crypto' ? (
        <div style={{ ...card, padding: 14, color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>🔒 Журнал по крипте закрыт: решения по крипте Сергей сейчас ведёт только для себя. Сигналы по крипте подписчикам не приходят.</div>
      ) : !items.length ? <div style={{ color: DIM, fontSize: 13, marginBottom: 10 }}>{mk === 'crypto' ? 'Решений по крипте пока нет.' : 'Решений по форексу пока нет.'}</div> : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((v, i) => {
          const ok = v.verdict === 'ДОПУСК';
          const long = v.side === 'LONG';
          const known = symbols.has(v.instrument);
          // неделя — по его времени (UTC+5), как у бота; первая карточка недели — с заголовком недели
          const wk = mondayOfSignal(v.time);
          const newWeek = i === 0 || wk !== mondayOfSignal(items[i - 1].time);
          const wv = videoOf.get(wk);
          return (
            <Fragment key={`${v.time}-${v.instrument}-${i}`}>
            {newWeek ? <WeekHeader monday={wk} video={wv} onPlay={() => wv && play(wv.id)} /> : null}
            <div
              data-day={i === 0 || dayOf(items[i - 1].time) !== dayOf(v.time) ? dayOf(v.time) : undefined}
              style={{ ...card, padding: 12, scrollMarginTop: 12, transition: 'box-shadow .3s', ...(flash === dayOf(v.time) ? { boxShadow: `0 0 0 2px ${ACCENT}` } : null) }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* 10.10.2026, его слово: «дата и время сигнала в журнале — очень заметно, но не очень крупно» —
                    плашка с золотой рамкой: подпись «сигнал» и фактическое время прихода сигнала (было 11px серым) */}
                <span
                  title="Фактическое время прихода сигнала (по вашему часовому поясу)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 7,
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 700,
                    color: FG,
                    background: `${ACCENT}14`,
                    border: `1px solid ${ACCENT}66`,
                    borderRadius: 6,
                    padding: '3px 9px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT }}>сигнал</span>
                  {fmtWhen(v.time)}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 14, color: FG }}>{v.instrument}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: long ? UP : DOWN }}>{v.side}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    padding: '2px 8px',
                    borderRadius: 6,
                    color: ok ? UP : DOWN,
                    border: `1px solid ${ok ? UP : DOWN}55`,
                  }}
                >
                  {v.verdict}
                  {v.both_layers ? ' · оба слоя' : ''}
                </span>
                {v.scenario ? <span style={{ ...label }}>{v.scenario === 'итог' ? 'сценарий по контексту' : `сценарий ${v.scenario}`}</span> : null}
                {known ? (
                  <button
                    onClick={() => onOpen(v.instrument)}
                    style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer' }}
                  >
                    открыть разбор
                  </button>
                ) : null}
              </div>
              {v.pic && urls[v.pic] ? (
                <img
                  src={urls[v.pic]}
                  alt={`${v.instrument} H4`}
                  loading="lazy"
                  onClick={() => setFull(urls[v.pic as string])}
                  style={{ width: '100%', maxWidth: 560, borderRadius: 10, display: 'block', marginTop: 10, cursor: 'zoom-in' }}
                />
              ) : null}
              {v.reason ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...label, marginBottom: 4 }}>{ok ? 'Почему беру?' : 'Почему не беру?'}</div>
                  <div style={{ color: FG, fontSize: 13, lineHeight: 1.6 }}>{v.reason}</div>
                </div>
              ) : null}
              {!ok && outOf.get(outKey(v.time, v.instrument, v.side))?.price?.status === 'против' ? (
                // 18.10.2026, его «давай все четыре»: отказ, после которого цена ушла против сигнала, — отсечённая сделка
                <div style={{ marginTop: 10, color: UP, fontSize: 13, fontWeight: 700 }}>🛡 Отказ сберёг: цена ушла против сигнала</div>
              ) : null}
              <OutcomeBlock o={outOf.get(outKey(v.time, v.instrument, v.side))} />
            </div>
            </Fragment>
          );
        })}
      </div>
      {full ? (
        <div
          onClick={() => setFull(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 60, overflowY: 'auto', overscrollBehavior: 'contain', padding: 16, cursor: 'zoom-out' }}
        >
          <img src={full} alt="" style={{ display: 'block', width: '100%', maxWidth: 'max-content', height: 'auto', margin: '0 auto', borderRadius: 10 }} />
        </div>
      ) : null}
    </div>
  );
}
