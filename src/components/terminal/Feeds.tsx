import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mondayOfSignal, type JournalVideo } from '@/lib/journalVideos';
import { ACCENT, DIM, DOWN, FG, MONO, UP, BORDER, card, label, fmtWhen, fromBotTime, pill, marketOfSym, type MarketKey } from './theme';
import type { HistoryDoc, HistoryDocM2 } from './History';
import { Beam } from './parts';
import { VideoReviews, WeekHeader } from './Reviews';
import type { TimeItem } from './TimeMachine';
import { newestMs, readSeen, timeMs, writeSeen } from '@/lib/journalSeen';

/**
 * Ленты терминала: скринер, тренд по накоплениям, резонанс, решения владельца.
 * Текст — ровно тот, что подписчик получает в боте; экран только делает
 * инструменты в нём нажимаемыми, чтобы сразу открыть разбор.
 */

export interface FeedDocs {
  // at — время скринера с поясом (мост с 22.09.2026); time — строка бота по часам VPS
  screener?: { time?: string | null; at?: string | null; groups?: string | null; top?: string | null; leaders?: Record<string, string> | null };
  // 18.10.2026: crypto_private — крипта «только ему» (/crypto me): подписчику журнал крипты под замком;
  // verdicts_crypto — его решения по крипте в этом режиме, лента только администратору
  verdicts?: { items?: Verdict[]; crypto_private?: boolean };
  verdicts_crypto?: { items?: Verdict[] };
  // 04.11.2026, его слово: «завести отдельный журнал по модели номер 2… этот журнал вижу только я» — его решения
  // по допускам модели 2 (ВЕРДИКТЫ_МОДЕЛЬ_2.md), в журнал решений модели 1 они не идут; лента только администратору
  verdicts_m2?: { items?: Verdict[] };
  // 04.11.2026, его слово: вкладку «Выход против недели» убрать, туда — графики модели 2 с комментарием; недели копятся 3 месяца
  model2?: { checked?: number; weeks?: Model2Week[] };
  // 25.09.2026: итоги решений из его субботнего разбора (таблица допусков) — кладутся раз в неделю
  outcomes?: { items?: Outcome[] };
  // 25.09.2026: история направления — мост пишет каждый полный круг
  history?: HistoryDoc;
  // 04.11.2026: история направления по модели 2 (вторая вкладка «Истории направления»), только админу
  history_m2?: HistoryDocM2;
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
  // 07.11.2026, его слово: «октябрь не трогай вообще… все сделки, которые сейчас открыты, уходят на результат ноября» —
  // месяц, в итог которого засчитана сделка (ГГГГ-ММ), если он не совпадает с месяцем сигнала (ВЫХОДЫ_СДЕЛОК.json → month)
  month?: string;
  exit?: string; // день закрытия (ГГГГ-ММ-ДД) — с ноября 2026 сделка стоит в календаре в этот день
}

/** Модель 2 (04.11.2026): ложный пробой недельной контекстной свечи — одна строка списка, как в боте
 *  (lozhnyi_proboy_nedeli.slova / srok), и картинка недели в закрытом ящике. */
export interface Model2Item {
  instrument: string;
  side: 'LONG' | 'SHORT';
  edge: 'хай' | 'лой';
  depth: number; // хвост за краем, % высоты контекстной свечи
  new: boolean; // пробой на этой неделе (иначе — ещё живёт с прошлых)
  ctx: string; // дата контекстной свечи
  week: string; // неделя пробоя
  text: string;
  srok: string;
  pic?: string;
}

export interface Model2Week {
  week: string; // понедельник закрытой недели, после которой собран список
  week_iso: string;
  made?: string;
  items: Model2Item[];
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
  // 19.10.2026: решения до кнопок в боте (до 09.09.2026) — из его таблицы решений; no_time — записан только день
  archive?: boolean;
  no_time?: boolean;
  // 31.10.2026: запись автомата по крипте (/crypto auto) — решение системы, сделки нет; price — куда пошла цена
  auto?: boolean;
  price?: Outcome['price'];
}

type Open = (symbol: string) => void;

/** 18.10.2026, его слово: «как отделить журнал по форексу и журнал крипты… давай с переключателем, делай везде». */
export function MarketSwitch({ value, onChange, counts, locked }: { value: MarketKey; onChange: (m: MarketKey) => void; counts: Record<MarketKey, number>; locked?: MarketKey }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {(['fx', 'crypto'] as MarketKey[]).map((m) => (
        <button key={m} onClick={() => onChange(m)} className={value === m ? 'tm-sel' : undefined} style={pill(value === m)}>
          {m === 'fx' ? 'Форекс' : 'Крипта'} · {locked === m ? '🔒' : counts[m]}
          {/* 25.10.2026, его слово: по выбранному бежит луч */}
          {value === m ? <Beam phase={1.9} /> : null}
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

/** Журнал модели 2 — отдельная вкладка администратора (04.11.2026, его слово: «завести отдельный журнал по модели
 *  номер 2… этот журнал вижу только я» и «здесь должен быть журнал модели 2… вместо тренда»). Его решения по допускам
 *  модели 2 — тем же видом, что журнал решений, без его вводных слов и итогов счёта (они про модель 1). */
export function Model2Journal({ doc, symbols, onOpen, picUrl }: { doc?: FeedDocs['verdicts_m2']; symbols: Set<string>; onOpen: Open; picUrl?: (p: string) => string }) {
  return (
    <div>
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Ваши решения по допускам модели 2 — ложный пробой недельной контекстной свечи. В журнал решений модели 1 они не
        попадают. Видно только вам.
      </div>
      <VerdictsFeed doc={doc} symbols={symbols} onOpen={onOpen} picUrl={picUrl} bare />
    </div>
  );
}

/** Модель 2 — ложный пробой недельной контекстной свечи (04.11.2026, его слово: «в терминале выход против недели
 *  вкладку — её удалить. Туда поместить все вот эти графики. С комментарием» и «каждую неделю графики должны
 *  обновляться… не хочу, чтобы они удалялись… 3 месяца»). Список — тот же, что бот присылает в воскресенье; каждая неделя
 *  своим блоком, свежая сверху и раскрыта, прошлые — по нажатию. Вкладка — только админу. Кнопки «открыть разбор» нет:
 *  разбор инструмента — это первая модель, а здесь вторая (его слово 04.11.2026). */
export function Model2Feed({ doc, picUrl }: { doc?: FeedDocs['model2']; picUrl?: (p: string) => string }) {
  const weeks = doc?.weeks || [];
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const isOpen = (w: Model2Week, i: number) => open[w.week_iso] ?? i === 0;
  // картинки — только у раскрытых недель; ссылки одним запросом, живут час
  const picKey = weeks
    .filter((w, i) => isOpen(w, i))
    .flatMap((w) => w.items.map((it) => it.pic || ''))
    .filter(Boolean)
    .join('|');
  useEffect(() => {
    const paths = picKey.split('|').filter((p) => p && !urls[p]);
    if (!paths.length) return;
    if (picUrl) {
      setUrls((u) => ({ ...u, ...Object.fromEntries(paths.map((p) => [p, picUrl(p)])) }));
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
        setUrls((u) => ({ ...u, ...m }));
      });
    return () => {
      alive = false;
    };
  }, [picKey]);
  if (!doc) return <Empty what="Списка модели 2" />;
  const cap = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  const row = (it: Model2Item) => {
    const up = it.side === 'LONG';
    const src = it.pic ? urls[it.pic] : undefined;
    return (
      <div key={`${it.instrument}-${it.side}`} style={{ ...card, padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ color: up ? UP : DOWN }}>{up ? '🟢' : '🔴'}</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: FG }}>{it.instrument}</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: up ? UP : DOWN, letterSpacing: '0.08em' }}>ждём {it.side}</span>
        </div>
        <div style={{ color: FG, fontSize: 13, lineHeight: 1.55 }}>{cap(it.text)}.</div>
        <div style={{ color: DIM, fontSize: 12, lineHeight: 1.5 }}>Срок: {it.srok}.</div>
        {src ? (
          <a href={src} target="_blank" rel="noreferrer" title="Открыть картинку целиком">
            <img src={src} alt={`${it.instrument} — ложный пробой недельной контекстной свечи`} loading="lazy" style={{ width: '100%', borderRadius: 8, border: `1px solid ${BORDER}`, display: 'block' }} />
          </a>
        ) : it.pic ? (
          <div style={{ color: DIM, fontSize: 12 }}>Картинка загружается…</div>
        ) : null}
      </div>
    );
  };
  return (
    <div>
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Модель 2 — ложный пробой недельной контекстной свечи: неделя ушла хвостом за хай или лой контекстной свечи и закрылась внутри. Ждём триггер H4 в сторону, обратную шипу: такой триггер приходит допуском без карточки системы, обычный триггер против него не приходит. Сигнал живёт три недели или пока неделя не закроется за границей контекстной свечи. Новая неделя появляется здесь после её закрытия, прошлые хранятся три месяца. Видно только вам.
      </div>
      {doc.checked === 0 && !weeks.length ? <div style={{ color: DIM, fontSize: 13 }}>Свечей недели не было — проверить не удалось.</div> : null}
      {weeks.map((w, i) => {
        const novye = w.items.filter((it) => it.new);
        const zhivut = w.items.filter((it) => !it.new);
        const on = isOpen(w, i);
        return (
          <div key={w.week_iso} style={{ marginBottom: 16 }}>
            <button
              onClick={() => setOpen((o) => ({ ...o, [w.week_iso]: !on }))}
              style={{ ...label, display: 'flex', width: '100%', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: `1px solid ${BORDER}`, padding: '8px 0', cursor: 'pointer', color: FG }}
            >
              <span>неделя с {w.week.slice(0, 5)} · новых {novye.length} · ещё живут {zhivut.length}</span>
              <span style={{ color: DIM }}>{on ? '▾' : '▸'}</span>
            </button>
            {on ? (
              <div style={{ marginTop: 10 }}>
                {!w.items.length ? <div style={{ color: DIM, fontSize: 13 }}>Ложных пробоев контекстной свечи не было.</div> : null}
                {novye.length ? (
                  <>
                    <div style={{ ...label, margin: '6px 0 8px' }}>новые — ложный пробой на этой неделе</div>
                    <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>{novye.map(row)}</div>
                  </>
                ) : null}
                {zhivut.length ? (
                  <>
                    <div style={{ ...label, margin: '6px 0 8px' }}>ещё живут — пробой на прошлых неделях</div>
                    <div style={{ display: 'grid', gap: 10 }}>{zhivut.map(row)}</div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
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
  { name: 'Октябрь 2026', trades: 10, wins: 1, pct: 0.74 },   // срез 31.10.2026
  { name: 'Сентябрь 2026', trades: 10, wins: 3, pct: 7.48 },
  { name: 'Август 2026', trades: 23, wins: 5, pct: 10.2 },
];
const fmtNum = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/** 19.10.2026, его выбор «вариант Б… под ним вариант В»: квадрат — сделка, площадь — результат. Стоп — маленький
 *  красный (1), тейк — большой зелёный: средний тейк месяца = (итог месяца в стопах + число стопов) / число тейков —
 *  у таблицы счёта нет размера каждой сделки. Красных много, но вся красная полоса меньше одного зелёного. */
function MonthTotals() {
  const U = 9;
  return (
    <div style={{ ...card, padding: 12, marginBottom: 12 }}>
      <div style={{ ...label, marginBottom: 8 }}>Моя таблица: итог последних трёх месяцев</div>
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
                +{fmtNum(m.pct, 2)}% к депозиту · ×{fmtNum(R)}
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
              {/* 19.10.2026, его слово: «не хватает информации о винрейте… и в календарях в итогах тоже» */}
              винрейт <b style={{ color: FG }}>{Math.round((m.wins / m.trades) * 100)}%</b> ({m.wins} из {m.trades}) · {loss} {plural(loss, 'стоп', 'стопа', 'стопов')} по 1 · {m.wins} {plural(m.wins, 'тейк', 'тейка', 'тейков')}, в среднем по {fmtNum(avg)}
            </div>
          </div>
        );
      })}
      <div style={{ color: DIM, fontSize: 12, lineHeight: 1.5, marginTop: 2 }}>
        Квадрат — сделка, его площадь — результат: стоп забирает 0,25% счёта, тейк приносит в разы больше. ×29,9 значит: за месяц заработано в 29,9 раза больше, чем забирает один стоп. Бывают и месяцы в минус: из 22 месяцев так закрылись 3. Прошлый результат не гарантирует будущий.
      </div>
    </div>
  );
}

/** Сделки решения в R из его записи итога — каждая отдельно (19.10.2026, его слово «надо было их разделить… в одном
 *  квадратике два тейка показать»): «ТЕЙК 10,8 к 1» → [+10,8] · «2 СТОПА · −2 R» → [−1, −1] · «СТОП · ПЕРЕЗАХОД · ТЕЙК 9,5 к 1»
 *  → [−1, +9,5] · «−5,3 R (4 ордера)» → [−5,3] · «БЕЗУБЫТОК», «≈ 0» → [0]. Не входил, отменил, в работе, итог не записан — []. */
export function tradesOfResult(r?: string): number[] {
  if (!r || !/ВОШЁЛ/.test(r) || /В РАБОТЕ|ЖДЁТ/.test(r)) return [];
  const n = (x: string) => parseFloat(x.replace(',', '.'));
  const out: number[] = [];
  for (const m of r.matchAll(/ТЕЙК\s+([\d,.]+)\s*к\s*1/g)) out.push(n(m[1]));
  const cnt = r.match(/(\d+)\s*СТОП/);
  const rr = r.match(/[−-]\s*([\d,.]+)\s*R/);
  if (cnt) {
    const k = parseInt(cnt[1], 10);
    const each = rr ? -n(rr[1]) / k : -1;
    for (let i = 0; i < k; i++) out.push(each);
  } else if (rr) out.push(-n(rr[1]));
  const pr = r.match(/\+\s*([\d,.]+)\s*R/); // «+1,4 R» — закрыт в плюс не по тейку (CADCHF 27.07)
  if (pr) out.push(n(pr[1]));
  // 19.10.2026, его «почему сентябрь опять 27%… убери один стоп 8-го»: «2 СТОПА · −2 R» давало три стопа — голый «СТОП»
  // считается одним стопом, только если число стопов и «−X R» не записаны
  if (!cnt && !rr && /СТОП/.test(r)) out.push(-1);
  if (!out.length && /БЕЗУБЫТОК|≈\s*0/.test(r)) out.push(0);
  return out;
}

const fmtR1 = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Number.isInteger(v) ? Math.abs(v) : fmtNum(Math.abs(v))}`;
const colorOfR = (v: number) => (v > 0 ? UP : v < 0 ? DOWN : '#4a453e');

// день решения по его времени (UTC+5), как неделя в журнале
const dayOf = (time: string) => new Date(new Date(time).getTime() + 5 * 3600e3).toISOString().slice(0, 10);
const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const JOURNAL_FROM = '2026-07'; // 19.10.2026: с 20.07 (первая серия сериала) — его решения из таблицы решений (до 09.09), дальше — нажатия кнопок в боте

/** 19.10.2026, его слово: «календарь текущего месяца… чтобы можно было пролистать… с сентября… нажать на квадратик
 *  сделки и сразу перейти к решению в списке». День окрашен по итогу его решений: тейк — зелёный, стоп — красный,
 *  безубыток — серый, решения без входа или ещё без итога — рамкой. Нажатие — к первому решению дня в списке. */
const ymShift = (ym: string, k: number) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + k, 1)).toISOString().slice(0, 7);
};

// 19.10.2026, его слово: «в веб-версии календарь огромный… сделать три календаря в ряд» — от 900 px три месяца
function useWide(px = 900) {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= px);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= px);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [px]);
  return wide;
}

// ⛔ 21.10.2026, его слово: «нажимаю на 19 августа… плюс 14,8… открывается золото… за 19 августа у меня была доллар Канада…
// много таких ошибок… исправляй все» — нажатие открывало первое решение дня в списке (а список — от новых к старым).
// who — чьё решение дало каждый квадратик сделки (номер в items), first — самое раннее решение дня, firstTrade — самое
// раннее решение дня со сделкой: нажатие на день открывает сделку, на квадратик — его сделку
type DayMark = { trades: number[]; who: number[]; first: number; firstTrade: number | null; n: number; moved?: boolean[] };
// хвосты: сделки прошлых месяцев, засчитанные в итог этого месяца (месяц → сделки в R и чьё решение дало каждую)
type Carry = Map<string, { trades: number[]; who: number[] }>;

function MonthGrid({ ym, by, carry, onPick, big, stats = true }: { ym: string; by: Map<string, DayMark>; carry?: Carry; onPick: (day: string, idx?: number) => void; big: boolean; stats?: boolean }) {
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const off = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  // 19.10.2026, его слово: «плюс три девять чего… хотя бы R добавь… стопов не 4, стопов получается 9,3» — суммы
  // по сделкам в R, а не число дней: 8 октября четыре ордера в минус −5,3 R — это не один стоп
  let plus = 0, minus = 0, wins = 0, losses = 0;
  for (const [k, x] of by)
    if (k.startsWith(ym))
      for (const [j, t] of x.trades.entries()) {
        // 07.11.2026, его слово: квадратик остаётся в дне сигнала, а в итог месяца сделка идёт по закрытию (с ноября)
        if (x.moved?.[j]) continue;
        if (t > 0) { plus += t; wins += 1; } else if (t < 0) { minus -= t; losses += 1; }
      }
  const tails = carry?.get(ym);
  for (const t of tails?.trades || []) {
    if (t > 0) { plus += t; wins += 1; } else if (t < 0) { minus -= t; losses += 1; }
  }
  const sum = plus - minus;
  const wr = wins + losses ? Math.round((wins / (wins + losses)) * 100) : null;
  const avgWin = wins ? plus / wins : 0;
  const avgLoss = losses ? minus / losses : 0;
  const R = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtNum(Math.abs(v))} R`;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <b style={{ fontSize: 15, color: FG }}>{MONTH_NAMES[m - 1]} {y}</b>
        {stats ? (
        <>
        <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: sum > 0 ? UP : sum < 0 ? DOWN : DIM }}>
          {plus || minus ? `итог ${R(sum)} · ${sum >= 0 ? '+' : '−'}${fmtNum(Math.abs(sum) * 0.25, 2)}% к депозиту` : 'итогов пока нет'}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: DIM, marginTop: 2 }}>
          {plus || minus ? (
            <>
              тейки <span style={{ color: UP }}>{R(plus)}</span> · стопы <span style={{ color: DOWN }}>{R(-minus)}</span>
            </>
          ) : null}
        </div>
        {wr != null ? (
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: DIM, marginTop: 2 }}>
            винрейт <span style={{ color: FG, fontWeight: 700 }}>{wr}%</span> ({wins} из {wins + losses})
            {wins && losses ? <> · тейк в среднем в {fmtNum(avgWin / avgLoss)} раза больше стопа</> : null}
          </div>
        ) : null}
        {tails?.trades.length ? (
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: DIM, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', alignItems: 'center' }}>
            <span>в т.ч. сделки прошлого месяца:</span>
            {tails.trades.map((t, j) => (
              <span
                key={j}
                onClick={() => onPick('', tails.who[j])}
                style={{ cursor: 'pointer', background: colorOfR(t), color: t !== 0 ? '#0a0a0a' : FG, borderRadius: 3, padding: '0 4px', fontWeight: 700, lineHeight: '16px' }}
              >
                {fmtR1(t)}
              </span>
            ))}
          </div>
        ) : null}
        </>
        ) : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <div key={d} style={{ fontFamily: MONO, fontSize: 11, color: DIM, textAlign: 'center' }}>{d}</div>
        ))}
        {Array.from({ length: off }, (_, i) => <div key={'e' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = `${ym}-${String(i + 1).padStart(2, '0')}`;
          const x = by.get(key);
          const tr = x ? x.trades : [];
          // одна сделка — клетка её цвета; несколько — каждая своим квадратиком внутри клетки
          const one = tr.length === 1 ? tr[0] : null;
          const bg = one != null ? colorOfR(one) : '#1a1815';
          const fg = one != null && one !== 0 ? '#0a0a0a' : x ? FG : '#5d574e';
          return (
            <button
              key={key}
              disabled={!x}
              onClick={() => x && onPick(key, x.firstTrade ?? x.first)}
              title={x ? `${x.n} ${plural(x.n, 'решение', 'решения', 'решений')} — открыть в списке` : undefined}
              style={{
                minHeight: 46, borderRadius: 7, border: 'none', background: bg, color: fg, padding: '3px 4px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch',
                cursor: x ? 'pointer' : 'default', boxShadow: x && !tr.length ? 'inset 0 0 0 2px #6a6256' : undefined,
              }}
            >
              <span style={{ fontSize: 11, textAlign: 'left', opacity: 0.85 }}>{i + 1}</span>
              {one != null ? (
                <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: big ? 15 : 12.5, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap', letterSpacing: big ? 0 : '-0.03em' }}>{fmtR1(one)}</span>
              ) : tr.length > 1 ? (
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                  {tr.map((t, j) => (
                    <span
                      key={j}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (x) onPick(key, x.who[j]);
                      }}
                      style={{
                        background: colorOfR(t), color: t !== 0 ? '#0a0a0a' : FG, borderRadius: 3, padding: '0 3px',
                        fontFamily: MONO, fontWeight: 700, fontSize: big ? 11.5 : 9.5, lineHeight: '15px', whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtR1(t)}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 19.10.2026, его слово: «календарь текущего месяца… чтобы можно было пролистать… с сентября… нажать на квадратик
 *  сделки и сразу перейти к решению в списке». День окрашен по итогу его решений: тейк — зелёный, стоп — красный,
 *  безубыток — серый, решения без входа или ещё без итога — рамкой. Нажатие — к первому решению дня в списке.
 *  В тот же день: «в веб-версии огромный… три календаря в ряд… цифры намного больше… кнопки вперёд-назад еле
 *  заметные» — на широком экране три месяца, на телефоне один; цифры крупнее, стрелки золотые. */
// 21.10.2026, его слово: «в машину времени добавь календарь, по которому легче выбирать допуск/отказ из журнала» — тот же
// календарь и в «Сделках до и после» (TimeMachine): итог решения берёт resultOf, итоги месяца там скрыты (stats=false)
export function JournalCalendar<T extends { time: string }>({ items, resultOf, monthOf, exitOf, onPick, hint, stats = true }: { items: T[]; resultOf: (x: T) => string | undefined; monthOf?: (x: T) => string | undefined; exitOf?: (x: T) => string | undefined; onPick: (day: string, item?: T) => void; hint?: string; stats?: boolean }) {
  const wide = useWide();
  const now = dayOf(new Date().toISOString()).slice(0, 7);
  const [end, setEnd] = useState(now);
  const count = wide ? 3 : 1;
  const months = Array.from({ length: count }, (_, i) => ymShift(end, i - count + 1)).filter((x) => x >= JOURNAL_FROM);
  const first = months[0] || end;
  const canBack = first > JOURNAL_FROM;
  const canFwd = end < now;
  const by = new Map<string, DayMark>();
  const carry: Carry = new Map();
  const at = (i: number) => new Date(items[i].time).getTime();
  items.forEach((v, i) => {
    const d = dayOf(v.time);
    const cur = by.get(d) || { trades: [], who: [], first: i, firstTrade: null, n: 0 };
    cur.n += 1;
    const tr0 = tradesOfResult(resultOf(v));
    // 07.11.2026: сделка, засчитанная в другой месяц, в клетку дня сигнала не идёт — она в итоге своего месяца
    // ⛔ закрытые месяцы (до ноября 2026) не меняются: перенос в месяц закрытия — только в ноябрь 2026 и позже
    const mo = monthOf?.(v);
    const moved = !!mo && mo >= '2026-11' && mo > d.slice(0, 7);
    // 07.11.2026, его слово: «11,2 в ноябре, три минуса в ноябре, по закрытию… и последующие месяцы так» — сделка стоит
    // в календаре в день закрытия; день не записан — строкой под итогом своего месяца
    const ex = moved ? exitOf?.(v) : undefined;
    if (moved && tr0.length && ex && ex.slice(0, 7) === mo) {
      const e = by.get(ex) || { trades: [], who: [], first: i, firstTrade: null, n: 0 };
      e.n += 1;
      e.trades.push(...tr0); e.who.push(...tr0.map(() => i));
      if (e.firstTrade == null) e.firstTrade = i;
      by.set(ex, e);
    } else if (moved && tr0.length) {
      const c = carry.get(mo!) || { trades: [], who: [] };
      c.trades.push(...tr0); c.who.push(...tr0.map(() => i));
      carry.set(mo!, c);
    }
    const tr = moved ? [] : tr0;
    cur.trades.push(...tr);
    cur.who.push(...tr.map(() => i));
    if (at(i) < at(cur.first)) cur.first = i;
    if (tr.length && (cur.firstTrade == null || at(i) < at(cur.firstTrade))) cur.firstTrade = i;
    by.set(d, cur);
  });
  const arrow = (k: number, ok: boolean) => (
    <button
      onClick={() => ok && setEnd(ymShift(end, k))}
      disabled={!ok}
      aria-label={k < 0 ? 'Предыдущий месяц' : 'Следующий месяц'}
      style={{
        flex: 'none', width: 44, height: 44, borderRadius: 10, fontSize: 22, fontWeight: 700, lineHeight: 1,
        border: `1.5px solid ${ok ? ACCENT : BORDER}`, background: ok ? `${ACCENT}22` : 'transparent',
        color: ok ? ACCENT : '#4a453e', cursor: ok ? 'pointer' : 'default',
      }}
    >
      {k < 0 ? '←' : '→'}
    </button>
  );
  return (
    <div style={{ ...card, padding: 12, marginBottom: 12 }}>
      {/* стрелки — в строке над календарём: сбоку они съедали ширину клеток на телефоне */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        {arrow(-1, canBack)}
        <div style={{ ...label }}>Календарь решений</div>
        {arrow(1, canFwd)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`, gap: 22 }}>
        {months.map((ym) => <MonthGrid key={ym} ym={ym} by={by} carry={carry} onPick={(day, i) => onPick(i == null ? day : dayOf(items[i].time), i == null ? undefined : items[i])} big={wide} stats={stats} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: DIM, marginTop: 10 }}>
        {[[UP, 'тейк'], [DOWN, 'стоп'], ['#4a453e', 'безубыток']].map(([c, n]) => (
          <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 13, height: 13, borderRadius: 3, background: c, display: 'inline-block' }} />
            {n}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 13, height: 13, borderRadius: 3, boxShadow: 'inset 0 0 0 2px #6a6256', display: 'inline-block' }} />
          без входа или итог позже
        </span>
      </div>
      <div style={{ color: DIM, fontSize: 12.5, marginTop: 6 }}>{hint || 'Число — результат сделки в R: 1 R — это один стоп. Несколько сделок за день — отдельными квадратиками. Нажмите на день — откроются решения этого дня в списке.'}</div>
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
            {o.month ? (
              <span style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>
                засчитано в итог: {MONTH_NAMES[+o.month.slice(5, 7) - 1].toLowerCase()} {o.month.slice(0, 4)}
              </span>
            ) : null}
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

// 07.11.2026, его слово: «нажимаешь на сделку в календаре… как будто проскакивает мимо… где-то наверху застревает…
// посередине экрана должна быть прям она: дата, инструмент, график». Причина: картинки карточек грузятся по пути
// (loading=lazy, высоты у них заранее нет) и толкают нужную карточку вниз, пока экран к ней едет. Поэтому карточку
// ведём до места: далеко — сразу прыжок к ней (картинки по дороге тогда не грузятся и не толкают), рядом — плавно;
// когда прокрутка встала, проверяем ещё раз и плавно доводим, пока карточка не перестанет сдвигаться.
// Карточка ниже экрана — посередине; выше экрана — дата у верхнего края. Пользователь сам крутит — доводка прекращается.
// Проба 07.11 на 220 карточках с догружающимися картинками: старый переход оставлял сделку на 31 000 px ниже экрана,
// плавный с доводкой — посередине через 4,5 с с рывками, прыжок с доводкой — посередине за 0,75 с.
function bringToCenter(el: HTMLElement) {
  const evs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  let stop = false;
  const cancel = () => { stop = true; };
  evs.forEach((e) => window.addEventListener(e, cancel, { passive: true }));
  const go = (behavior: ScrollBehavior = 'smooth') =>
    el.scrollIntoView({ behavior, block: el.getBoundingClientRect().height <= window.innerHeight * 0.9 ? 'center' : 'start' });
  go(Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 2 ? 'auto' : 'smooth');
  const t0 = performance.now();
  let last = NaN, still = 0, settled: number | null = null;
  const tick = () => {
    if (stop || !el.isConnected || performance.now() - t0 > 7000) {
      evs.forEach((e) => window.removeEventListener(e, cancel));
      return;
    }
    const top = el.getBoundingClientRect().top;
    still = Math.abs(top - last) < 0.5 ? still + 1 : 0;
    last = top;
    // ~130 мс на месте: карточка встала там же, где после прошлой доводки, — готово; сдвинулась — доводим снова
    if (still === 8 && (settled == null || Math.abs(top - settled) > 2)) {
      settled = top;
      go();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// 18.10.2026: picUrl — терминал в Телеграме берёт картинки из открытого ящика tgpub, а не по подписанной ссылке
// 04.11.2026: bare — журнал модели 2: без вводных слов журнала решений и без итогов счёта по месяцам (они про модель 1)
export function VerdictsFeed({ doc, outcomes, videos = [], symbols, onOpen, picUrl, privateCrypto, seenKey, fx = false, bare = false }: { doc?: FeedDocs['verdicts']; outcomes?: FeedDocs['outcomes']; videos?: JournalVideo[]; symbols: Set<string>; onOpen: Open; picUrl?: (path: string) => string; privateCrypto?: FeedDocs['verdicts_crypto']; seenKey?: string; fx?: boolean; bare?: boolean }) {
  // 18.10.2026: администратору — и его решения по крипте «только мне» (privateCrypto); подписчику в этом режиме
  // журнал крипты под замком
  const all = [...(doc?.items || []), ...(privateCrypto?.items || [])].sort((a, b) => b.time.localeCompare(a.time));
  const cryptoLocked = !!doc?.crypto_private && !privateCrypto;
  const [mk, setMk] = useState<MarketKey>('fx');
  const items = cryptoLocked && mk === 'crypto' ? [] : all.filter((v) => marketOfSym(v.instrument) === mk);
  const counts = { fx: all.filter((v) => marketOfSym(v.instrument) === 'fx').length, crypto: all.filter((v) => marketOfSym(v.instrument) === 'crypto').length };
  // 25.10.2026, идея 7 «новое в журнале» (веб-кабинет, fx): решения, которых ученик ещё не видел, — с золотой меткой
  // и одним проходом скана; увиденным журнал считается через 2,5 с. Первый раз новым ничего не считается
  const [seenAt] = useState(() => (fx ? readSeen(seenKey) : null));
  const newest = newestMs(all);
  useEffect(() => {
    if (!fx || !seenKey || !newest) return;
    if (seenAt == null) { writeSeen(seenKey, newest); return; }
    const t = window.setTimeout(() => writeSeen(seenKey, newest), 2500);
    return () => window.clearTimeout(t);
  }, [fx, seenKey, newest, seenAt]);
  // 25.10.2026, идея 10: плашка «ДОПУСК / ОТКАЗ» ставится штампом, когда карточка появляется на экране (один раз)
  const listRef = useRef<HTMLDivElement>(null);
  const itemsKey = items.map((v) => v.time).join('|');
  useEffect(() => {
    const root = listRef.current;
    if (!fx || !root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const el = e.target as HTMLElement;
      if (e.isIntersecting) {
        el.classList.remove('eg-vs-wait');
        el.classList.add('eg-vstamp');
        io.unobserve(el);
      } else if (!el.classList.contains('eg-vstamp')) el.classList.add('eg-vs-wait');
    }), { rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('[data-vstamp]').forEach((el) => { if (!el.classList.contains('eg-vstamp')) io.observe(el); });
    return () => io.disconnect();
  }, [fx, itemsKey]);
  // 25.09.2026: серии «Допуск-отказ» — плеер сверху; «разбор этой недели» у карточек включает серию в нём
  const [vid, setVid] = useState<string | null>(null);
  // 19.10.2026: день, выбранный в календаре, — его решения в списке подсвечены пару секунд
  const [flash, setFlash] = useState<string | null>(null);
  // 19.10.2026, его слово: «перешёл к решению в списке… чтобы вернуться к календарю, приходится листать долго» —
  // плавающая кнопка «к календарю», пока календарь ушёл вверх за экран
  const calRef = useRef<HTMLDivElement>(null);
  const [calAbove, setCalAbove] = useState(false);
  useEffect(() => {
    const el = calRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setCalAbove(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  });
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
      {bare ? null : (
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Мои допуски и отказы{oldest ? `, с ${fmtWhen(oldest).slice(0, 10)}` : ''}. До 09.09.2026 — из моей таблицы решений, с 09.09 — то, что получили подписчики в боте. Свежие сверху. Время — по вашему часовому поясу. Под каждым решением — что было дальше: итог из еженедельного разбора и куда пошла цена после сигнала.
      </div>
      )}
      {bare ? null : <MonthTotals />}
      <div ref={calRef} style={{ scrollMarginTop: 12 }}>
      {/* 19.10.2026, его слово: «по журналу 10 сделок за сентябрь… везде должно быть одинаково»: календарь считает все
          решения — и валюты, и крипту (биткоин 08.09, 2 стопа), а не только открытую вкладку */}
      <JournalCalendar
        items={all}
        resultOf={(v) => outOf.get(outKey(v.time, v.instrument, v.side))?.result}
        monthOf={(v) => outOf.get(outKey(v.time, v.instrument, v.side))?.month}
        exitOf={(v) => outOf.get(outKey(v.time, v.instrument, v.side))?.exit}
        onPick={(day, item) => {
          // 07.11.2026: нажатие на сделку ведёт к ЭТОЙ сделке (раньше — к первому решению дня, а в дне их бывает несколько)
          const want = item ? marketOfSym(item.instrument) : null;
          const other = all.find((v) => dayOf(v.time) === day && marketOfSym(v.instrument) !== mk);
          const here = want ? want === mk : all.some((v) => dayOf(v.time) === day && marketOfSym(v.instrument) === mk);
          if (want && !here && !(cryptoLocked && want === 'crypto')) setMk(want);
          else if (!want && !here && other && !(cryptoLocked && marketOfSym(other.instrument) === 'crypto')) setMk(marketOfSym(other.instrument));
          const mark = item ? outKey(item.time, item.instrument, item.side) : day;
          window.setTimeout(() => {
            const el = (item && document.querySelector(`[data-pick="${CSS.escape(mark)}"]`)) || document.querySelector(`[data-day="${day}"]`);
            if (el) bringToCenter(el as HTMLElement);
          }, here ? 0 : 60);
          setFlash(mark);
          window.setTimeout(() => setFlash((f) => (f === mark ? null : f)), 3200);
        }}
      />
      </div>
      {calAbove ? (
        <button
          onClick={() => calRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            position: 'fixed', right: 14, bottom: 'calc(92px + env(safe-area-inset-bottom))', zIndex: 55,
            padding: '11px 16px', borderRadius: 999, border: `1.5px solid ${ACCENT}`, background: '#16130e',
            color: ACCENT, fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: '0 8px 24px rgba(0,0,0,.55)', cursor: 'pointer',
          }}
        >
          ↑ К календарю
        </button>
      ) : null}
      {videos.length ? <VideoReviews videos={videos} currentId={vid} onPick={setVid} boxRef={box} /> : null}
      {cryptoLocked && mk === 'crypto' ? (
        <div style={{ ...card, padding: 14, color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>🔒 Журнал по крипте закрыт: решения по крипте Сергей сейчас ведёт только для себя. Сигналы по крипте подписчикам не приходят.</div>
      ) : !items.length ? <div style={{ color: DIM, fontSize: 13, marginBottom: 10 }}>{mk === 'crypto' ? 'Решений по крипте пока нет.' : 'Решений по форексу пока нет.'}</div> : null}
      <div ref={listRef} style={{ display: 'grid', gap: 10 }}>
        {(() => { let newN = 0; return items.map((v, i) => {
          const ok = v.verdict === 'ДОПУСК';
          const fresh = seenAt != null && timeMs(v.time) > seenAt;
          const nIdx = fresh ? newN++ : 0;
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
              data-pick={outKey(v.time, v.instrument, v.side)}
              className={fresh ? 'eg-new' : undefined}
              style={{ ...card, padding: 12, scrollMarginTop: 12, transition: 'box-shadow .3s', ...(flash === dayOf(v.time) || flash === outKey(v.time, v.instrument, v.side) ? { boxShadow: `0 0 0 2px ${ACCENT}` } : null), ...(fresh ? { '--n': nIdx } : null) } as CSSProperties}
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
                  {v.no_time ? dayOf(v.time).split('-').reverse().join('.') : fmtWhen(v.time)}
                </span>
                {fresh ? <span className="eg-new-dot">новое</span> : null}
                {v.archive ? (
                  <span title="Решение до кнопок в боте — из моей таблицы решений" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: DIM, border: `1px dashed ${BORDER}`, borderRadius: 6, padding: '2px 7px' }}>
                    из таблицы решений
                  </span>
                ) : null}
                <span style={{ fontFamily: MONO, fontSize: 14, color: FG }}>{v.instrument}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: long ? UP : DOWN }}>{v.side}</span>
                <span
                  data-vstamp={fx ? '' : undefined}
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
                {v.scenario ? <span style={{ ...label }}>{v.scenario === 'итог' ? 'сценарий по контексту' : v.scenario === 'модель 2' ? 'модель 2' : `сценарий ${v.scenario}`}</span> : null}
                {/* 04.11.2026: в журнале модели 2 кнопки нет — разбор инструмента это первая модель (его слово) */}
                {known && !bare ? (
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
              <OutcomeBlock
                o={
                  outOf.get(outKey(v.time, v.instrument, v.side)) ||
                  (v.auto ? { time: v.time, instrument: v.instrument, side: v.side, result: 'АВТОМАТ', text: 'записал бот по итогу системы, сделки не было', price: v.price } : undefined)
                }
              />
            </div>
            </Fragment>
          );
        }); })()}
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
