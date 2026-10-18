import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ACCENT, BORDER, CARD, DIM, DOWN, FG, MONO, UP, card, label, fmtWhen } from './theme';
import { GEN } from './screenerParse';

/** 18.10.2026, его слово «Нравится, внедряй в кабинет» (после макета): «Машина времени» и «Тренажёр «Допуск или
 *  отказ»» — на одних данных. Ленту timemachine кладёт субботний terminal_ishody.py: его решения с окончательным
 *  итогом, карточка того дня и свечи MT5 вокруг.
 *  18.10.2026, его слово: «надо сделать три графика: сначала H4, ниже D1 и в самом низу неделя… сразу будет видно до
 *  и после» и «для каждого графика должны быть критерии, которые были на момент сигнала… и в тренажёре также».
 *  ⛔ Левее золотой линии — только свечи, закрывшиеся к моменту сигнала; правее — то, чего тогда не знал никто. */
type Bar = [string, number, number, number, number];
interface Tf {
  cut: number;
  bars: Bar[];
}
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
  tf?: { H4?: Tf; D1?: Tf; W1?: Tf };
  // что бот записал в журнал сигналов в момент карточки — по таймфреймам
  w1?: { acc?: string; range?: string };
  d1?: { acc?: string; range?: string; scen?: string; conf?: string; rows?: [string, string][]; restored?: boolean };
  // 18.10.2026, его выбор «Делай 1»: дневка и H4 — из карточки, восстановленной нынешним кодом бота на момент сигнала,
  // только проверки, которые существовали в тот день
  h4?: { rows?: [string, string][]; restored?: boolean };
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
  const m = (s || '').trim().match(/^([A-Z]+)\s+(BUY|SELL)/);
  if (!m) return '';
  const g = GEN[m[1]];
  return `${g ? 'группа ' + g : m[1]} · ${m[2] === 'BUY' ? 'рост' : 'падение'}`;
}
// «с 16.09.2026» → «с 16.09»: год и так понятен
const short = (s?: string) => (s || '').replace(/(\d{2}\.\d{2})\.20\d{2}/g, '$1');
function resultTone(r: string): 'take' | 'stop' | 'skip' {
  const u = r.toUpperCase();
  if (u.includes('ТЕЙК')) return 'take';
  if (u.includes('СТОП') || /−\d/.test(u)) return 'stop';
  return 'skip';
}
const keyOf = (x: TimeItem) => `${x.time}|${x.instrument}|${x.side}`;

function Chart({ tf, show, when }: { tf: Tf; show: boolean; when: string }) {
  const B = tf.bars;
  const W = 760, H = 250, pl = 8, pr = 64, pt = 12, pb = 22;
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
  const w = Math.max(1, step * 0.62);
  const n = show ? B.length : tf.cut;
  const xc = X(tf.cut) - step / 2;
  const dg = hi > 1000 ? 0 : hi > 100 ? 1 : hi > 10 ? 3 : 4;
  const day = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}`;
  const every = Math.max(1, Math.round(B.length / 8));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 1, 2, 3].map((k) => {
        const p = lo + ((hi - lo) * k) / 3;
        return (
          <g key={k}>
            <line x1={pl} x2={W - pr} y1={Y(p)} y2={Y(p)} stroke="#1e1c19" />
            <text x={W - pr + 6} y={Y(p) + 4} fill="#6f6a62" fontSize={11} fontFamily={MONO}>{p.toFixed(dg)}</text>
          </g>
        );
      })}
      {B.map((b, i) => (i % every === 0 ? <text key={'d' + i} x={X(i)} y={H - 6} fill="#6f6a62" fontSize={11} textAnchor="middle" fontFamily={MONO}>{day(b[0])}</text> : null))}
      {!show ? (
        <g>
          <rect x={xc} y={pt} width={W - pr - xc} height={H - pt - pb} fill="#0d0c0b" />
          <text x={(xc + W - pr) / 2} y={H / 2} fill="#4a4640" fontSize={14} textAnchor="middle">будущее закрыто</text>
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
      <rect x={xc - 60} y={pt} width={120} height={19} rx={4} fill={ACCENT} />
      <text x={xc} y={pt + 13} fill="#0a0a0a" fontSize={12} fontWeight={700} textAnchor="middle">решение {when}</text>
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

function Rows({ rows }: { rows: [string, string][] }) {
  if (!rows.length) return null;
  return (
    <div style={{ marginTop: 6 }}>
      {rows.map(([a, b]) => (
        <div key={a} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
          <span style={{ color: DIM, whiteSpace: 'nowrap' }}>{a}</span>
          <span style={{ color: FG, textAlign: 'right' }}>{b}</span>
        </div>
      ))}
    </div>
  );
}
function weekRows(it: TimeItem): [string, string][] {
  const r: [string, string][] = [];
  const wk = weekWords(it.week);
  if (wk) r.push(['Критерии недели', wk]);
  const cr = critWords(it.crit);
  if (cr) r.push(['Свинг, свеча, накопления', cr]);
  if (it.w1?.acc) r.push(['Тренд по накоплениям', it.w1.acc]);
  if (it.w1?.range) r.push(['Рейндж', short(it.w1.range)]);
  return r;
}
function dayRows(it: TimeItem): [string, string][] {
  const r: [string, string][] = [];
  if (it.d1?.rows?.length) r.push(...it.d1.rows);
  else {
    // в журнал попадают только допуски бота: направление и подтверждение дневки бот уже проверил
    r.push(['Направление и подтверждение', 'прошли проверку бота']);
    if (it.d1?.conf) r.push(['Подтверждение', it.d1.conf]);
  }
  if (it.d1?.acc) r.push(['Тренд по накоплениям', short(it.d1.acc)]);
  if (it.d1?.range) r.push(['Рейндж', short(it.d1.range)]);
  if (it.d1?.scen) r.push(['Сценарий', it.d1.scen]);
  else if (it.scenario && !it.d1?.rows?.length) r.push(['Сценарий', it.scenario === 'итог' ? 'по контексту' : `сценарий ${it.scenario}`]);
  return r;
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
/** Картинка H4, которую в момент решения получили подписчики (та же, что в журнале решений). */
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
    <img src={url} alt="" style={{ width: '100%', borderRadius: 8, marginTop: 8, border: `1px solid ${BORDER}`, cursor: 'zoom-out' }} onClick={() => setOpen(false)} />
  ) : (
    <button style={{ ...btn(DIM), marginTop: 8, padding: 8, fontSize: 10 }} onClick={() => setOpen(true)}>картинка H4, которую получили подписчики</button>
  );
}

function TfBox({ title, tf, show, when, children }: { title: string; tf?: Tf; show: boolean; when: string; children?: ReactNode }) {
  if (!tf || !tf.bars.length) return null;
  return (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ ...label, marginBottom: 6 }}>{title} · {show ? 'до и после' : 'как было ' + when}</div>
      <Chart tf={tf} show={show} when={when} />
      {children}
    </div>
  );
}

function Layout({ it, show, side, onOpen, symbols, hidePic }: { it: TimeItem; show: boolean; side: ReactNode; onOpen: Open; symbols: Set<string>; hidePic?: boolean }) {
  const wide = typeof window === 'undefined' ? true : window.innerWidth >= 900;
  const when = fmtWhen(it.time).slice(0, 5);
  const ctx = ctxWords(it.ctx);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1fr) 330px' : '1fr', gap: 12, alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <TfBox title={`${it.instrument} · H4`} tf={it.tf?.H4} show={show} when={when}>
          <Rows rows={[['Сигнал', 'триггер на H4 — с него пришла карточка'], ...(it.h4?.rows || [])]} />
          {hidePic ? null : <Pic it={it} />}
        </TfBox>
        <TfBox title={`${it.instrument} · дневка`} tf={it.tf?.D1} show={show} when={when}>
          <Rows rows={dayRows(it)} />
        </TfBox>
        <TfBox title={`${it.instrument} · неделя`} tf={it.tf?.W1} show={show} when={when}>
          <Rows rows={weekRows(it)} />
        </TfBox>
        <div style={{ color: DIM, fontSize: 12, lineHeight: 1.55 }}>
          Справа от золотой линии — то, чего в момент решения ещё никто не знал. Под каждым графиком — то, что бот видел в момент сигнала.
          {it.d1?.restored ? ' Дневка и H4 восстановлены по истории: алгоритм бота пересчитан на свечах до момента сигнала, показаны только проверки, которые были в тот день.' : ''}
        </div>
      </div>
      <div style={{ ...card, padding: 12, position: wide ? 'sticky' : undefined, top: 12 }}>
        <div style={{ ...label }}>Сигнал {fmtWhen(it.time)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 6 }}>
          {symbols.has(it.instrument) ? (
            <button onClick={() => onOpen(it.instrument)} style={{ background: 'none', border: 'none', padding: 0, color: FG, fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>{it.instrument}</button>
          ) : (
            <span style={{ color: FG, fontSize: 22, fontWeight: 700 }}>{it.instrument}</span>
          )}
          <span style={sideTag(it.side)}>{it.side}</span>
        </div>
        {ctx ? <Rows rows={[['Контекст', ctx]]} /> : null}
        {side}
      </div>
    </div>
  );
}

const Empty = () => (
  <div style={{ ...card, padding: 16, color: DIM, fontSize: 13 }}>Решения с итогом появятся после субботнего разбора недели.</div>
);

export function TimeMachine({ doc, symbols, onOpen }: { doc?: { items?: TimeItem[] }; symbols: Set<string>; onOpen: Open }) {
  const items = useMemo(() => [...(doc?.items || [])].filter((x) => x.tf?.D1).sort((a, b) => b.time.localeCompare(a.time)), [doc]);
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
  // порядок перемешан (по свёртке ключа), но у всех один и тот же — свежие решения не идут подряд
  const items = useMemo(() => [...(doc?.items || [])].filter((x) => x.tf?.D1).sort((x, y) => hash(keyOf(x)) - hash(keyOf(y))), [doc]);
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
