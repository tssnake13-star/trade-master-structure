import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ACCENT, BORDER, CARD, DIM, DOWN, FG, MONO, UP, card, label, fmtWhen, marketOfSym, type MarketKey } from './theme';
import { MarketSwitch } from './Feeds';
import { GEN } from './screenerParse';
import LiveChart from './LiveChart';
import type { Layer, Scene, ScenePanel, SBar } from './scene';

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
  // 18.10.2026, его слово «почему они не выглядят как в терминале? Почему нет циклов… накоплений, свингов, реверса?»:
  // рисунок бота на момент сигнала (H4 — draw_h4, дневка и неделя — draw_scenario) данными живого графика, файлом в
  // хранилище terminal; у каждой панели after — свечи после сигнала
  scene?: string | null;
}
type TmPanel = ScenePanel & { after?: SBar[] };

/** 18.10.2026: терминал в Телеграме — графики статичные («как в боте»), файлы из открытого ящика tgpub, а не из
 *  закрытого terminal по подписанной ссылке. В кабинете — как раньше (значения по умолчанию). */
export interface TmView {
  still?: boolean;
  // 18.10.2026, его слово про Телеграм: «цифры с графика убрать… пояснения… для мобильной версии надо что-то
  // упрощённое, а если хочешь посмотреть, что что значит, заходи в веб-версию» — рисунок без номеров и их списка
  plain?: boolean;
  scene?: (path: string) => string;
  pic?: (path: string) => string;
}
// 18.10.2026, его слово: «здесь живой график не нужен… в веб-версии тоже можно сделать статичную картинку» — и в кабинете
// машина времени рисует статично
export const TmViewCtx = createContext<TmView>({ still: true });

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
  const view = useContext(TmViewCtx);
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setUrl(null);
    setOpen(false);
    if (!it.pic) return;
    let alive = true;
    if (view.pic) {
      setUrl(view.pic(it.pic));
      return;
    }
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

const NO_HIDDEN = new Set<Layer>();
function useScene(path?: string | null) {
  const view = useContext(TmViewCtx);
  const [sc, setSc] = useState<{ panels: TmPanel[] } | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'none'>(path ? 'loading' : 'none');
  useEffect(() => {
    setSc(null);
    setState(path ? 'loading' : 'none');
    if (!path) return;
    let alive = true;
    // путь в хранилище; адрес с «/» — локальная проверка без базы
    const signed = view.scene
      ? Promise.resolve({ data: { signedUrl: view.scene(path) } })
      : path.startsWith('/') ? Promise.resolve({ data: { signedUrl: path } }) : supabase.storage.from('terminal').createSignedUrl(path, 3600);
    signed.then(async ({ data }) => {
      if (!alive) return;
      if (!data?.signedUrl) {
        setState('none');
        return;
      }
      try {
        const j = await (await fetch(data.signedUrl)).json();
        if (alive) {
          setSc(j);
          setState('ok');
        }
      } catch {
        if (alive) setState('none');   // нет рисунка — простой график
      }
    });
    return () => {
      alive = false;
    };
  }, [path]);
  return { sc, state };
}

// 18.10.2026, его слово про H4: «накопление, треугольники остаются… убираем свинги, точку PPR и реверс… будет чище…
// кнопку «Показать все» на всякий случай оставь». Чисто: накопления (слой acc) и оба треугольника (голубой — по
// накоплению H4, оранжевый — по свингам дневки) с их номерами; свинги, реверс, точки PPR, вертикаль триггера и
// стрелки ожидаемого движения — под кнопкой.
const TRI = new Set(['#00e5ff', '#ff8c1a']);
const DROP_LABEL = new Set(['#4dff9a', '#ff5fc8', '#87ceeb', '#ffa07a', '#aab2bd']);
function cleanH4(p: TmPanel): TmPanel {
  return {
    ...p,
    shapes: p.shapes.filter((x) => x.L === 'acc' || (x.k === 'line' && TRI.has(String(x.c).toLowerCase()))),
    labels: p.labels.filter((l) => !DROP_LABEL.has(String(l.c).toLowerCase())),
  };
}
/** Панель рисунка бота на момент сигнала: до решения — свечи бота, после — ещё и свечи «что было дальше»;
 *  золотая черта — момент решения. Окно одно и то же в обоих видах, чтобы «после» не прыгало. */
function scenePanel(sc: { panels: TmPanel[] } | null, tf: string, show: boolean, all = true): Scene | null {
  const P0 = sc?.panels.find((x) => x.tf === tf);
  const P = P0 && tf === 'H4' && !all ? cleanH4(P0) : P0;
  if (!P || !P.bars?.length) return null;
  const after = P.after || [];
  const n = P.bars.length;
  const bars = show ? [...P.bars, ...after] : P.bars;
  const x1 = Math.max(P.xlim[1], n - 0.5 + after.length + 1);
  let lo = P.ylim[0], hi = P.ylim[1];
  if (show) after.forEach((b) => { lo = Math.min(lo, b[3]); hi = Math.max(hi, b[2]); });
  const line = { k: 'line' as const, p: [[n - 0.5, lo], [n - 0.5, hi]] as [number, number][], c: ACCENT, a: 1, w: 2, d: [4, 3], z: 9, L: 'other' as Layer };
  // окно одно в обоих видах: до правого края, куда дойдут свечи «после» (edge задаёт окно по умолчанию)
  return { v: 1, title: null, texts: [], panels: [{ ...P, bars, xlim: [P.xlim[0], x1], edge: x1, ylim: [lo, hi], shapes: [...P.shapes, line] }] };
}

function TfBox({ title, tf, show, when, live, loading, tools, h4, children }: { title: string; tf?: Tf; show: boolean; when: string; live?: Scene | null; loading?: boolean; tools?: ReactNode; h4?: boolean; children?: ReactNode }) {
  const view = useContext(TmViewCtx);
  const [fs, setFs] = useState(false);
  if (!live && !loading && (!tf || !tf.bars.length)) return null;
  const small = { ...btn(DIM), width: 'auto', marginTop: 0, padding: '5px 10px', fontSize: 10 };
  // 18.10.2026, его слово (школьный бот, холодные): «всё-таки уберём все цифры и все пояснения… для холодного это вообще
  // не нужно… раскрывает то, что не нужно» — в Телеграме без номеров и их списка все три графика (машина времени и
  // тренажёр в Телеграме есть только у школьного бота); в кабинете номера остаются
  const shown = live && view.plain ? { ...live, panels: live.panels.map((p) => ({ ...p, labels: [] })) } : live;
  const chart = shown ? <LiveChart scene={shown} hidden={NO_HIDDEN} noHead still={view.still} /> : null;
  return (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ ...label }}>{title} · {show ? 'до и после' : 'как было ' + when}</div>
        {live ? (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {tools}
            <button style={small} onClick={() => setFs(true)}>⤢ на весь экран</button>
          </div>
        ) : null}
      </div>
      {/* 18.10.2026: пока грузится рисунок бота, простые свечи не показываем — иначе график «меняется» на глазах */}
      {live ? chart : loading ? <div style={{ color: DIM, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>загружаю рисунок…</div> : tf ? <Chart tf={tf} show={show} when={when} /> : null}
      {children}
      {fs && live ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#080808', overflow: 'auto', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ ...label }}>{title}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {tools}
              <button style={small} onClick={() => setFs(false)}>✕ свернуть</button>
            </div>
          </div>
          {chart}
        </div>
      ) : null}
    </div>
  );
}

function Layout({ it, show, side, onOpen, symbols, hidePic }: { it: TimeItem; show: boolean; side: ReactNode; onOpen: Open; symbols: Set<string>; hidePic?: boolean }) {
  const wide = typeof window === 'undefined' ? true : window.innerWidth >= 900;
  const when = fmtWhen(it.time).slice(0, 5);
  const ctx = ctxWords(it.ctx);
  const { sc, state } = useScene(it.scene);
  const [all, setAll] = useState(false);
  const loading = state === 'loading';
  const allBtn = (
    <button style={{ ...btn(all ? ACCENT : DIM), width: 'auto', marginTop: 0, padding: '5px 10px', fontSize: 10 }} onClick={() => setAll(!all)}>
      {all ? 'только накопления и треугольники' : 'показать всё'}
    </button>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1fr) 330px' : 'minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 12, minWidth: 0 }}>
        <TfBox title={`${it.instrument} · H4`} tf={it.tf?.H4} show={show} when={when} live={scenePanel(sc, 'H4', show, all)} loading={loading} tools={allBtn} h4>
          <Rows rows={[['Сигнал', 'триггер на H4 — с него пришла карточка'], ...(it.h4?.rows || [])]} />
          {hidePic ? null : <Pic it={it} />}
        </TfBox>
        <TfBox title={`${it.instrument} · дневка`} tf={it.tf?.D1} show={show} when={when} live={scenePanel(sc, 'D1', show)} loading={loading}>
          <Rows rows={dayRows(it)} />
        </TfBox>
        <TfBox title={`${it.instrument} · неделя`} tf={it.tf?.W1} show={show} when={when} live={scenePanel(sc, 'W1', show)} loading={loading}>
          <Rows rows={weekRows(it)} />
        </TfBox>
        <div style={{ color: DIM, fontSize: 12, lineHeight: 1.55 }}>
          Справа от золотой линии — то, чего в момент решения ещё никто не знал. Под каждым графиком — то, что бот видел в момент сигнала.
          {it.d1?.restored ? ' Дневка и H4 восстановлены по истории: алгоритм бота пересчитан на свечах до момента сигнала, показаны только проверки, которые были в тот день.' : ''}
        </div>
      </div>
      {/* 18.10.2026, его слово: карточка с кнопками «наверху лучше» — на телефоне она первой (order), на компьютере справа */}
      <div style={{ ...card, padding: 12, position: wide ? 'sticky' : undefined, top: 12, order: wide ? 0 : -1 }}>
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
  // 18.10.2026: форекс и крипта — переключателем, как в журнале решений
  const [mk, setMk] = useState<MarketKey>('fx');
  const all = useMemo(() => [...(doc?.items || [])].filter((x) => x.tf?.D1).sort((a, b) => b.time.localeCompare(a.time)), [doc]);
  const items = useMemo(() => all.filter((x) => marketOfSym(x.instrument) === mk), [all, mk]);
  const counts = { fx: all.filter((x) => marketOfSym(x.instrument) === 'fx').length, crypto: all.filter((x) => marketOfSym(x.instrument) === 'crypto').length };
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const pick = (m: MarketKey) => {
    setMk(m);
    setIdx(0);
    setShown(false);
  };
  if (!all.length) return <Empty />;
  if (!items.length)
    return (
      <div>
        <MarketSwitch value={mk} onChange={pick} counts={counts} />
        <div style={{ color: DIM, fontSize: 13 }}>{mk === 'crypto' ? 'Решений по крипте с итогом пока нет.' : 'Решений по форексу с итогом пока нет.'}</div>
      </div>
    );
  const it = items[Math.min(idx, items.length - 1)];
  return (
    <div>
      <MarketSwitch value={mk} onChange={pick} counts={counts} />
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
  const [mk, setMk] = useState<MarketKey>('fx');
  const all = useMemo(() => [...(doc?.items || [])].filter((x) => x.tf?.D1).sort((x, y) => hash(keyOf(x)) - hash(keyOf(y))), [doc]);
  const items = useMemo(() => all.filter((x) => marketOfSym(x.instrument) === mk), [all, mk]);
  const counts = { fx: all.filter((x) => marketOfSym(x.instrument) === 'fx').length, crypto: all.filter((x) => marketOfSym(x.instrument) === 'crypto').length };
  const [ans, setAns] = useState<Record<string, string>>(loadAns);
  const firstOpen = (list: TimeItem[], a: Record<string, string>) => {
    const k = list.findIndex((x) => !a[keyOf(x)]);
    return k < 0 ? 0 : k;
  };
  const [idx, setIdx] = useState(() => firstOpen(items, loadAns()));
  const pick = (m: MarketKey) => {
    setMk(m);
    setIdx(firstOpen(all.filter((x) => marketOfSym(x.instrument) === m), ans));
  };
  if (!all.length) return <Empty />;
  if (!items.length)
    return (
      <div>
        <MarketSwitch value={mk} onChange={pick} counts={counts} />
        <div style={{ color: DIM, fontSize: 13 }}>{mk === 'crypto' ? 'Решений по крипте с итогом пока нет.' : 'Решений по форексу с итогом пока нет.'}</div>
      </div>
    );
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
      <MarketSwitch value={mk} onChange={pick} counts={counts} />
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
