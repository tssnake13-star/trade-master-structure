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

/** Итог сделки в размерах риска из его записи итога: «ТЕЙК 10,8 к 1» → +10,8 · «−5,3 R» → −5,3 · «СТОП» → −1 ·
 *  «БЕЗУБЫТОК», «≈ 0» → 0. Не входил, отменил, в работе — null: в итог месяца не идут. */
export function rOfResult(r?: string): number | null {
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

const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const fmtR = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '') + (Math.round(Math.abs(x) * 10) / 10).toString().replace('.', ',');

/** 18.10.2026, его слово: «винрейт 23%… если человек начнёт проверять, он будет смотреть только стопы. Как это может
 *  продавать?» — над журналом итог по месяцам: сколько тейков, сколько в минус и сумма в размерах риска. Считается
 *  только из его записей итога (rOfResult); отказы — сколько было и после скольких цена ушла против сигнала. */
function MonthTotals({ items, outOf }: { items: { time: string; instrument: string; side: string; verdict: string }[]; outOf: (v: { time: string; instrument: string; side: string }) => Outcome | undefined }) {
  const by = new Map<string, { take: number; minus: number; sum: number; n: number; refuse: number; saved: number }>();
  for (const v of items) {
    const d = new Date(new Date(v.time).getTime() + 5 * 3600 * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, '0')}`;
    const m = by.get(key) || { take: 0, minus: 0, sum: 0, n: 0, refuse: 0, saved: 0 };
    const o = outOf(v);
    const r = rOfResult(o?.result);
    if (r != null) {
      m.n += 1;
      m.sum += r;
      if (r > 0) m.take += 1;
      if (r < 0) m.minus += 1;
    }
    if (v.verdict !== 'ДОПУСК') {
      m.refuse += 1;
      if (o?.price?.status === 'против') m.saved += 1;
    }
    by.set(key, m);
  }
  const rows = [...by.entries()].filter(([, m]) => m.n || m.refuse).sort((a, b) => b[0].localeCompare(a[0]));
  if (!rows.length) return null;
  return (
    <div style={{ ...card, padding: 12, marginBottom: 12 }}>
      <div style={{ ...label, marginBottom: 8 }}>Итог по месяцам</div>
      {rows.map(([k, m]) => (
        <div key={k} style={{ fontSize: 13, lineHeight: 1.6, color: FG, marginBottom: 6 }}>
          <b style={{ textTransform: 'capitalize' }}>{MONTHS[parseInt(k.slice(5), 10)]}</b>
          {m.n ? (
            <>
              {' · '}
              <span style={{ color: UP }}>{m.take} {plural(m.take, 'тейк', 'тейка', 'тейков')}</span>
              {', '}
              <span style={{ color: DOWN }}>{m.minus} в минус</span>
              {' · итог '}
              <b style={{ color: m.sum > 0 ? UP : m.sum < 0 ? DOWN : DIM }}>{fmtR(m.sum)}</b>
              {' риска'}
            </>
          ) : null}
          {m.refuse ? (
            <span style={{ color: DIM }}>
              {' · '}
              {m.refuse} {plural(m.refuse, 'отказ', 'отказа', 'отказов')}
              {m.saved ? `, после ${m.saved} цена ушла против сигнала` : ''}
            </span>
          ) : null}
        </div>
      ))}
      <div style={{ color: DIM, fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
        Риск — то, что забирает один стоп: −1. Тейк в среднем приносит в 9,5 раза больше. Поэтому сделок в минус больше, а итог — в плюсе. Прошлый результат не гарантирует будущий.
      </div>
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
      <MonthTotals items={items} outOf={(v) => outOf.get(outKey(v.time, v.instrument, v.side))} />
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
            <div style={{ ...card, padding: 12 }}>
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
