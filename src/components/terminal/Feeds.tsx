import { Fragment, type ReactNode } from 'react';
import { ACCENT, DIM, DOWN, FG, MONO, UP, BORDER, card, label, fmtWhen } from './theme';

/**
 * Ленты терминала: скринер, тренд по накоплениям, резонанс, решения владельца.
 * Текст — ровно тот, что подписчик получает в боте; экран только делает
 * инструменты в нём нажимаемыми, чтобы сразу открыть разбор.
 */

export interface FeedDocs {
  screener?: { time?: string | null; groups?: string | null; top?: string | null };
  trend?: { lines?: string[] };
  resonance?: { time?: string | null; text?: string | null };
  verdicts?: { items?: Verdict[] };
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
      <div style={{ ...label, marginBottom: 12 }}>скринер от {doc.time || '—'} · одобрен автором</div>
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

export function ResonanceFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['resonance']; symbols: Set<string>; onOpen: Open }) {
  if (!doc?.text) return <Empty what="Резонанс-скана" />;
  return (
    <div>
      <div style={{ ...label, marginBottom: 12 }}>резонанс от {doc.time || '—'}</div>
      <div style={{ ...card, padding: 14 }}>
        <TextBlock text={doc.text} symbols={symbols} onOpen={onOpen} />
      </div>
    </div>
  );
}

export function VerdictsFeed({ doc, symbols, onOpen }: { doc?: FeedDocs['verdicts']; symbols: Set<string>; onOpen: Open }) {
  const items = doc?.items || [];
  if (!items.length) return <Empty what="Решений" />;
  return (
    <div>
      <div style={{ ...label, marginBottom: 12 }}>
        допуски и отказы, которые ушли подписчикам · время — ваше местное
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
