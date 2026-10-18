import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ACCENT, BORDER, CARD, DIM, DOWN, FG, MONO, UP, card, label, fmtWhen } from './theme';
import { GEN } from './screenerParse';

/** 18.10.2026, его слово «Нравится, внедряй в кабинет» (после макета): «Машина времени» и «Тренажёр «Допуск или
 *  отказ»» — на одних данных. Ленту timemachine кладёт субботний terminal_ishody.py: его решения с окончательным
 *  итогом, карточка того дня из таблицы допусков и дневки MT5 вокруг. Часть графика до решения — только закрытые
 *  дневки до дня сигнала (что было известно), правее — то, чего в момент решения не знал никто. */
export interface TimeItem {
  time: string;
  instrument: string;
  side: string;
  verdict: 'ДОПУСК' | 'ОТКАЗ';
  reason?: string;
  scenario?: string;
  week?: string;
  crit?: string;
  ctx?: string;
  result: string;
  text?: string;
  cut: number;
  bars: [string, number, number, number, number][];
  pic?: string | null;
}

type Open = (symbol: string) => void;

// «SW✓ SV✓ НК✗» → «свинг ✓ · свеча ✓ · накопления ✗»; другое — как есть
const CRIT: Record<string, string> = { SW: 'свинг', SV: 'свеча', 'НК': 'накопления', MM: 'режим рынка' };
function critWords(s?: string) {
  const t = (s || '').trim();
  if (!t || t === '—') return '';
  const parts = t.split(/\s+/).map((p) => {
    const m = p.match(/^(SW|SV|НК|MM)([✓✗—])$/);
    return m ? `${CRIT[m[1]]} ${m[2]}` : null;
  });
  return parts.every(Boolean) ? parts.join(' · ') : t;
}
function weekWords(s?: string) {
  const m = (s || '').match(/^(\d)\/(\d)$/);
  return m ? `${m[1]} из ${m[2]}` : '';
}
// «DXY BUY» → «группа доллара · рост»
function ctxWords(s?: string) {
  const t = (s || '').trim();
  const m = t.match(/^([A-Z]+)\s+(BUY|SELL)/);
  if (!m) return '';
  const g = GEN[m[1]];
  return `${g ? 'группа ' + g : m[1]} · ${m[2] === 'BUY' ? 'рост' : 'падение'}`;
}
function resultTone(r: string): 'take' | 'stop' | 'skip' {
  const u = r.toUpperCase();
  if (u.includes('ТЕЙК')) return 'take';
  if (u.includes('СТОП') || /−\d/.test(u)) return 'stop';
  return 'skip';
}
const keyOf = (x: TimeItem) => `${x.time}|${x.instrument}|${x.side}`;

function Chart({ it, show }: { it: TimeItem; show: boolean }) {
  const B = it.bars;
  const W = 760, H = 380, pl = 8, pr = 64, pt = 14, pb = 26;
  let hi = -Infinity, lo = Infinity;
  B.forEach((b) => {
    hi = Math.max(hi, b[2]);
    lo = Math.min(lo, b[3]);
  });
  const pad = (hi - lo) * 0.06;
  hi += pad;
  lo -= pad;
  const step = (W - pl - pr) / B.length;
  const X = (i: number) => pl + (i + 0.5) * step;
  const Y = (p: number) => pt + ((hi - p) / (hi - lo)) * (H - pt - pb);
  const w = step * 0.62;
  const n = show ? B.length : it.cut;
  const xc = X(it.cut) - step / 2;
  const dg = hi > 1000 ? 0 : hi > 100 ? 1 : hi > 10 ? 3 : 4;
  const day = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 1, 2, 3, 4].map((k) => {
        const p = lo + ((hi - lo) * k) / 4;
        return (
          <g key={k}>
            <line x1={pl} x2={W - pr} y1={Y(p)} y2={Y(p)} stroke="#1e1c19" />
            <text x={W - pr + 6} y={Y(p) + 4} fill="#6f6a62" fontSize={11} fontFamily={MONO}>{p.toFixed(dg)}</text>
          </g>
        );
      })}
      {B.map((b, i) => (i % 10 === 0 ? <text key={'d' + i} x={X(i)} y={H - 8} fill="#6f6a62" fontSize={11} textAnchor="middle" fontFamily={MONO}>{day(b[0])}</text> : null))}
      {!show ? (
        <g>
          <rect x={xc} y={pt} width={W - pr - xc} height={H - pt - pb} fill="#0d0c0b" />
          <text x={(xc + W - pr) / 2} y={H / 2} fill="#4a4640" fontSize={15} textAnchor="middle">будущее закрыто</text>
        </g>
      ) : null}
      {B.slice(0, n).map((b, i) => {
        const col = b[4] >= b[1] ? UP : DOWN;
        return (
          <g key={i}>
            <line x1={X(i)} x2={X(i)} y1={Y(b[2])} y2={Y(b[3])} stroke={col} />
            <rect x={X(i) - w / 2} y={Y(Math.max(b[1], b[4]))} width={w} height={Math.max(1, Math.abs(Y(b[1]) - Y(b[4])))} fill={col} />
          </g>
        );
      })}
      <line x1={xc} x2={xc} y1={pt} y2={H - pb} stroke={ACCENT} strokeWidth={2} strokeDasharray="5 4" />
      <rect x={xc - 60} y={pt} width={120} height={20} rx={4} fill={ACCENT} />
      <text x={xc} y={pt + 14} fill="#0a0a0a" fontSize={12} fontWeight={700} textAnchor="middle">решение {fmtWhen(it.time).slice(0, 5)}</text>
    </svg>
  );
}

const sideTag = (side: string): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 6,
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  color: side === 'LONG' ? UP : DOWN,
  backgroundColor: side === 'LONG' ? 'rgba(63,185,143,.14)' : 'rgba(224,96,79,.14)',
});
const btn = (col = ACCENT): CSSProperties => ({
  width: '100%',
  marginTop: 12,
  padding: 12,
  borderRadius: 10,
  border: `1px solid ${col}`,
  background: 'transparent',
  color: col,
  fontFamily: MONO,
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 700,
  cursor: 'pointer',
});

function Rows({ it }: { it: TimeItem }) {
  const rows: [string, string][] = [];
  const wk = weekWords(it.week);
  if (wk) rows.push(['Неделя', wk]);
  const cr = critWords(it.crit);
  if (cr) rows.push(['Критерии недели', cr]);
  const cx = ctxWords(it.ctx);
  if (cx) rows.push(['Контекст', cx]);
  // как в журнале решений: «итог» — сценарий по контексту
  if (it.scenario) rows.push(['Сценарий', it.scenario === 'итог' ? 'по контексту' : `сценарий ${it.scenario}`]);
  return (
    <div>
      {rows.map(([a, b]) => (
        <div key={a} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
          <span style={{ color: DIM }}>{a}</span>
          <span style={{ color: FG, textAlign: 'right' }}>{b}</span>
        </div>
      ))}
    </div>
  );
}
function Stamp({ it }: { it: TimeItem }) {
  const col = it.verdict === 'ДОПУСК' ? UP : DOWN;
  return (
    <div style={{ marginTop: 12, border: `2px solid ${col}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ ...label, color: DIM }}>Решение Сергея · {fmtWhen(it.time)}</div>
      <div style={{ color: col, fontSize: 20, fontWeight: 800, letterSpacing: '0.06em', marginTop: 2 }}>{it.verdict}</div>
      {it.reason ? <div style={{ color: FG, fontStyle: 'italic', marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>«{it.reason}»</div> : null}
    </div>
  );
}
function Result({ it }: { it: TimeItem }) {
  const t = resultTone(it.result);
  const col = t === 'take' ? UP : t === 'stop' ? DOWN : BORDER;
  const bg = t === 'take' ? 'rgba(63,185,143,.10)' : t === 'stop' ? 'rgba(224,96,79,.10)' : '#191714';
  return (
    <div style={{ marginTop: 12, border: `1px solid ${col}`, background: bg, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ ...label, color: DIM }}>Что было дальше</div>
      <div style={{ color: FG, fontWeight: 800, fontSize: 16, marginTop: 2 }}>{it.result}</div>
      {it.text ? <div style={{ color: FG, fontSize: 13, lineHeight: 1.55, marginTop: 4 }}>{it.text}</div> : null}
    </div>
  );
}
function Pic({ it }: { it: TimeItem }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setUrl(null);
    setOpen(false);
    if (!it.pic) return;
    let alive = true;
    supabase.storage.from('terminal').createSignedUrl(it.pic, 3600).then(({ data }) => {
      if (alive && data?.signedUrl) setUrl(data.signedUrl);
    });
    return () => {
      alive = false;
    };
  }, [it.pic]);
  if (!url) return null;
  return open ? (
    <img src={url} alt="" style={{ width: '100%', borderRadius: 8, marginTop: 10, border: `1px solid ${BORDER}` }} onClick={() => setOpen(false)} />
  ) : (
    <button style={{ ...btn(DIM), marginTop: 10, padding: 8, fontSize: 10 }} onClick={() => setOpen(true)}>картинка H4 в момент решения</button>
  );
}

function Layout({ it, show, side, onOpen, symbols }: { it: TimeItem; show: boolean; side: ReactNode; onOpen: Open; symbols: Set<string> }) {
  const wide = typeof window === 'undefined' ? true : window.innerWidth >= 900;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1fr) 330px' : '1fr', gap: 12 }}>
      <div style={{ ...card, padding: 12 }}>
        <div style={{ ...label, marginBottom: 6 }}>{it.instrument} · дневка · {show ? 'что было дальше' : 'как было ' + fmtWhen(it.time).slice(0, 5)}</div>
        <Chart it={it} show={show} />
        <div style={{ color: DIM, fontSize: 12, marginTop: 8 }}>Справа от золотой линии — то, чего в момент решения ещё никто не знал.</div>
      </div>
      <div style={{ ...card, padding: 12 }}>
        <div style={{ ...label }}>Сигнал {fmtWhen(it.time)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 6 }}>
          {symbols.has(it.instrument) ? (
            <button onClick={() => onOpen(it.instrument)} style={{ background: 'none', border: 'none', padding: 0, color: FG, fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>{it.instrument}</button>
          ) : (
            <span style={{ color: FG, fontSize: 22, fontWeight: 700 }}>{it.instrument}</span>
          )}
          <span style={sideTag(it.side)}>{it.side}</span>
        </div>
        <Rows it={it} />
        {side}
      </div>
    </div>
  );
}

const Empty = () => (
  <div style={{ ...card, padding: 16, color: DIM, fontSize: 13 }}>Решения с итогом появятся после субботнего разбора недели.</div>
);

export function TimeMachine({ doc, symbols, onOpen }: { doc?: { items?: TimeItem[] }; symbols: Set<string>; onOpen: Open }) {
  const items = useMemo(() => [...(doc?.items || [])].sort((a, b) => b.time.localeCompare(a.time)), [doc]);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  if (!items.length) return <Empty />;
  const it = items[Math.min(idx, items.length - 1)];
  return (
    <div>
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
        Выбери решение — увидишь рынок таким, каким он был в момент решения. Решение записано в тот же день, задним числом его не поменять.
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 6 }}>
        {items.map((x, i) => (
          <button
            key={keyOf(x)}
            onClick={() => {
              setIdx(i);
              setShown(false);
            }}
            style={{ flex: '0 0 auto', textAlign: 'left', background: CARD, border: `1px solid ${i === idx ? ACCENT : BORDER}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: FG }}
          >
            <div style={{ fontFamily: MONO, fontSize: 10, color: DIM }}>{fmtWhen(x.time)}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              {x.instrument} <span style={{ ...sideTag(x.side), fontSize: 9, padding: '1px 5px' }}>{x.side}</span>
            </div>
          </button>
        ))}
      </div>
      <Layout
        it={it}
        show={shown}
        symbols={symbols}
        onOpen={onOpen}
        side={
          <>
            <Stamp it={it} />
            <Pic it={it} />
            {shown ? <Result it={it} /> : <button style={btn()} onClick={() => setShown(true)}>Что было дальше →</button>}
          </>
        }
      />
    </div>
  );
}

// ответы тренажёра — только в этом браузере (удобство, не учёт)
const STORE = 'tm_trainer_v1';
function loadAns(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}') || {};
  } catch {
    return {};
  }
}
function saveAns(a: Record<string, string>) {
  try {
    localStorage.setItem(STORE, JSON.stringify(a));
  } catch {
    /* приватное окно — просто не запоминаем */
  }
}

export function Trainer({ doc, symbols, onOpen }: { doc?: { items?: TimeItem[] }; symbols: Set<string>; onOpen: Open }) {
  const items = useMemo(() => {
    const a = [...(doc?.items || [])];
    // порядок перемешан (по свёртке ключа), но у всех один и тот же — свежие решения не идут подряд
    return a.sort((x, y) => (hash(keyOf(x)) - hash(keyOf(y))));
  }, [doc]);
  const [ans, setAns] = useState<Record<string, string>>(loadAns);
  const [idx, setIdx] = useState(() => {
    const a = loadAns();
    const k = items.findIndex((x) => !a[keyOf(x)]);
    return k < 0 ? 0 : k;
  });
  if (!items.length) return <Empty />;
  const it = items[Math.min(idx, items.length - 1)];
  const done = items.filter((x) => ans[keyOf(x)]);
  const hit = done.filter((x) => ans[keyOf(x)] === x.verdict).length;
  const my = ans[keyOf(it)];
  const answer = (v: string) => {
    const a = { ...ans, [keyOf(it)]: v };
    setAns(a);
    saveAns(a);
  };
  const next = () => setIdx((i) => (i + 1) % items.length);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6 }}>Карточка из прошлого. Реши сам: допуск или отказ? Потом увидишь решение Сергея и что было дальше.</div>
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: DIM, whiteSpace: 'nowrap' }}>
          совпало с Сергеем: <b style={{ color: ACCENT, fontSize: 16 }}>{hit}</b> из <b style={{ color: ACCENT, fontSize: 16 }}>{done.length}</b> · карточка {Math.min(idx, items.length - 1) + 1} из {items.length}
        </div>
      </div>
      <Layout
        it={it}
        show={!!my}
        symbols={symbols}
        onOpen={onOpen}
        side={
          !my ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn(UP)} onClick={() => answer('ДОПУСК')}>Допуск</button>
              <button style={btn(DOWN)} onClick={() => answer('ОТКАЗ')}>Отказ</button>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 12, fontSize: 13, color: DIM }}>
                Твой ответ: <b style={{ color: FG }}>{my}</b> ·{' '}
                {my === it.verdict ? <span style={{ color: UP }}>совпало с Сергеем</span> : <span style={{ color: DOWN }}>у Сергея по-другому</span>}
              </div>
              <Stamp it={it} />
              <Result it={it} />
              <button style={btn()} onClick={next}>Следующая карточка →</button>
            </>
          )
        }
      />
    </div>
  );
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
