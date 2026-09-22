import { Fragment, type ReactNode } from 'react';
import { ACCENT, DIM, DOWN, FG, MONO, UP, BORDER, card, label, fmtWhen, fromBotTime } from './theme';

/**
 * Ленты терминала: скринер, тренд по накоплениям, резонанс, решения владельца.
 * Текст — ровно тот, что подписчик получает в боте; экран только делает
 * инструменты в нём нажимаемыми, чтобы сразу открыть разбор.
 */

export interface FeedDocs {
  // at — время скринера с поясом (мост с 22.09.2026); time — строка бота по часам VPS
  screener?: { time?: string | null; at?: string | null; groups?: string | null; top?: string | null; leaders?: Record<string, string> | null };
  trend?: { lines?: string[] };
  verdicts?: { items?: Verdict[] };
  falsex?: { checked?: number; items?: FalseExit[] };
}

export interface FalseExit {
  instrument: string;
  state: 'ложный' | 'отменён';
  hdir: 'вверх' | 'вниз';
  text: string;
}

export interface Verdict {
  time: string;
  instrument: string;
  side: string;
  scenario: string;
  verdict: 'ДОПУСК' | 'ОТКАЗ';
  both_layers?: boolean;
  reason?: string;
}

type Open = (symbol: string) => void;

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

/** Ложный выход на дневке: выход против тренда недели. Тот же список, что бот
 *  присылает каждое утро (kontekst_svecha.false_exit_scan). */
export function FalseExitFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['falsex']; symbols: Set<string>; onOpen: Open }) {
  if (!doc) return <Empty what="Списка ложных выходов" />;
  const items = doc.items || [];
  const work = items.filter((i) => i.state === 'ложный');
  const back = items.filter((i) => i.state === 'отменён');
  const row = (i: FalseExit) => (
    <div key={i.instrument} style={{ ...card, padding: 12, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <span style={{ color: i.hdir === 'вверх' ? UP : DOWN }}>{i.hdir === 'вверх' ? '🟢' : '🔴'}</span>
      <span style={{ fontFamily: MONO, fontSize: 14, color: FG }}>{i.instrument}</span>
      <span style={{ color: FG, fontSize: 13 }}>{i.text}</span>
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
        Дневка вышла из накопления против тренда недели. Список обновляется каждое утро после закрытия дневки. Информация, не запрет.
      </div>
      {doc.checked === 0 ? (
        <div style={{ color: DIM, fontSize: 13 }}>Свечей не было — проверить не удалось.</div>
      ) : !items.length ? (
        <div style={{ color: DIM, fontSize: 13 }}>Сейчас ложных выходов на дневке нет.</div>
      ) : null}
      {work.length ? (
        <>
          <div style={{ ...label, margin: '6px 0 8px' }}>рабочий сценарий — ложный выход</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{work.map(row)}</div>
        </>
      ) : null}
      {back.length ? (
        <>
          <div style={{ ...label, margin: '6px 0 8px' }}>выход оказался ложным — цена вернулась, свежие</div>
          <div style={{ display: 'grid', gap: 8 }}>{back.map(row)}</div>
        </>
      ) : null}
    </div>
  );
}

export function VerdictsFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['verdicts']; symbols: Set<string>; onOpen: Open }) {
  const items = doc?.items || [];
  if (!items.length) return <Empty what="Решений" />;
  const oldest = items[items.length - 1]?.time;
  return (
    <div>
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        Допуски и отказы автора, которые получили подписчики{oldest ? `, с ${fmtWhen(oldest).slice(0, 10)}` : ''}. Свежие сверху, хранятся последние 90 дней. Время — по вашему часовому поясу.
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((v, i) => {
          const ok = v.verdict === 'ДОПУСК';
          const long = v.side === 'LONG';
          const known = symbols.has(v.instrument);
          return (
            <div key={`${v.time}-${v.instrument}-${i}`} style={{ ...card, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>{fmtWhen(v.time)}</span>
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
                {v.scenario ? <span style={{ ...label }}>сценарий {v.scenario}</span> : null}
                {known ? (
                  <button
                    onClick={() => onOpen(v.instrument)}
                    style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer' }}
                  >
                    открыть разбор
                  </button>
                ) : null}
              </div>
              {v.reason ? <div style={{ color: FG, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{v.reason}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
