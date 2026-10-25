import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ACCENT, BORDER, CARD, DIM, DOWN, FG, MONO, UP, card, label, fmtWhen, marketOfSym, type MarketKey } from './theme';
import { JournalCalendar, MarketSwitch } from './Feeds';
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
  // ⛔ 21.10.2026, его слово: «что было дальше… не по текущий момент, а по тому моменту, когда был взят тейк… и линию
  // поставить» — свеча выхода из сделки (H4 по часам сервера, «2026-09-30T04:00») или только день («2026-10-06») и чем
  // закрылась: тейк / стоп / безубыток / закрыта (ВЫХОДЫ_СДЕЛОК.json → субботний terminal_ishody.py)
  exit?: string;
  exit_kind?: string;
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

// 25.10.2026, идея 6: за сколько «что было дальше» доходит до конца на всех трёх графиках
const REVEAL_MS = 2400;

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

/** Сколько свечей «после» показывать: до свечи выхода включительно. Дневка, неделя и выход без часа — свечи, начавшиеся
 *  не позже дня выхода; H4 — до свечи выхода. У свечей H4 рисунка бота только даты: дни до выхода целиком, в день
 *  выхода — столько свечей, сколько их в ленте до свечи выхода (там время полное). Нет выхода — все свечи «после». */
function keepAfter(after: Bar[], tf: string, exit?: string, h4?: Tf): number {
  if (!exit || !after.length) return after.length;
  const day = exit.slice(0, 10);
  let k = 0;
  if (tf !== 'H4' || exit.length <= 10) {
    while (k < after.length && after[k][0].slice(0, 10) <= day) k++;
  } else if (after[0][0].length > 10) {
    while (k < after.length && after[k][0] <= exit) k++;
  } else {
    const full = h4 ? h4.bars.slice(h4.cut) : [];
    const reach = full.length > 0 && full[full.length - 1][0].slice(0, 10) >= day;
    const inDay = reach ? full.filter((b) => b[0].slice(0, 10) === day && b[0] <= exit).length : Math.floor(+exit.slice(11, 13) / 4) + 1;
    while (k < after.length && after[k][0].slice(0, 10) < day) k++;
    for (let j = 0; j < inDay && k < after.length && after[k][0].slice(0, 10) === day; j++) k++;
  }
  return Math.max(1, k);
}
/** ⛔ 21.10.2026, его слово: «показывать до тейка… Стопы показывать не обязательно. На графике. Можно просто показать,
 *  куда пошла цена, и так понятно, что стоп». До какого дня «после»: выход из ВЫХОДЫ_СДЕЛОК.json; у сделки с входом без
 *  записанного выхода (стопы и безубытки) — неделя: день решения и 5 торговых дней (у всех 13 стопов и безубытков, где
 *  день выхода известен, сделка закрылась в эту неделю). Решения без входа — «после» целиком, как было. */
function cutOf(it: TimeItem): string | undefined {
  if (it.exit) return it.exit;
  if (!it.result.toUpperCase().startsWith('ВОШЁЛ')) return undefined;
  const d1 = it.tf?.D1;
  const aft = d1 ? d1.bars.slice(d1.cut) : [];
  return aft.length ? aft[Math.min(5, aft.length - 1)][0].slice(0, 10) : undefined;
}
// линия и подпись «тейк 30.09» — только у тейка; стоп и так виден по тому, куда пошла цена
function exitLook(it: TimeItem): { tag: string; col: string } | null {
  if (!it.exit || it.exit_kind !== 'тейк') return null;
  return { tag: `тейк ${it.exit.slice(8, 10)}.${it.exit.slice(5, 7)}`, col: UP };
}

function Chart({ tf, show, when, keep, exitCol, rev = 1 }: { tf: Tf; show: boolean; when: string; keep: number; exitCol?: string; rev?: number }) {
  // ⛔ 21.10.2026: окно — свечи до решения и «после» до свечи выхода, одно в обоих видах; шкала цены «как было» — только
  // по свечам до решения, иначе по пустому месту видно, куда цена пойдёт
  const B = tf.bars.slice(0, tf.cut + keep);
  const W = 760, H = 250, pl = 8, pr = 64, pt = 12, pb = 22;
  let hi = -Infinity, lo = Infinity;
  B.slice(0, show ? B.length : tf.cut).forEach((b) => {
    hi = Math.max(hi, b[2]);
    lo = Math.min(lo, b[3]);
  });
  const pad = (hi - lo) * 0.06;
  hi += pad;
  lo -= pad;
  // у линии выхода справа три пустых места — иначе она сливается с краем графика
  const step = (W - pl - pr) / (B.length + (exitCol ? 3 : 0));
  const X = (i: number) => pl + (i + 0.5) * step;
  const Y = (p: number) => pt + ((hi - p) / (hi - lo)) * (H - pt - pb);
  const w = Math.max(1, step * 0.62);
  // 25.10.2026, идея 6: «что было дальше» проигрывается — видна доля rev свечей после решения
  const n = show ? tf.cut + Math.ceil(keep * rev) : tf.cut;
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
      {show && exitCol && keep > 0 && rev >= 1 ? <line className="eg-exit-flash" x1={X(B.length - 1) + step / 2} x2={X(B.length - 1) + step / 2} y1={pt} y2={H - pb} stroke={exitCol} strokeWidth={2} /> : null}
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
/** Панель рисунка бота на момент сигнала: до решения — свечи бота, после — ещё и свечи «что было дальше» до свечи
 *  выхода; золотая черта — момент решения, зелёная — тейк. Окно одно и то же в обоих видах, чтобы «после»
 *  не прыгало. */
function scenePanel(sc: { panels: TmPanel[] } | null, tf: string, show: boolean, all = true, it?: TimeItem, rev = 1): Scene | null {
  const P0 = sc?.panels.find((x) => x.tf === tf);
  const P = P0 && tf === 'H4' && !all ? cleanH4(P0) : P0;
  if (!P || !P.bars?.length) return null;
  const afterAll = (P.after || []).slice(0, keepAfter(P.after || [], tf, it ? cutOf(it) : undefined, it?.tf?.H4));
  // 25.10.2026, идея 6: «что было дальше» проигрывается — видна доля rev свечей «после»; окно и шкала — по всем свечам,
  // чтобы график не прыгал, пока свечи появляются
  const after = afterAll.slice(0, Math.ceil(afterAll.length * rev));
  const n = P.bars.length;
  const bars = show ? [...P.bars, ...after] : P.bars;
  const x1 = Math.max(P.xlim[1], n - 0.5 + afterAll.length + 1);
  let lo = P.ylim[0], hi = P.ylim[1];
  if (show) afterAll.forEach((b) => { lo = Math.min(lo, b[3]); hi = Math.max(hi, b[2]); });
  const line = { k: 'line' as const, p: [[n - 0.5, lo], [n - 0.5, hi]] as [number, number][], c: ACCENT, a: 1, w: 2, d: [4, 3], z: 9, L: 'other' as Layer };
  const ex = it ? exitLook(it) : null;
  // линия выхода — по правому краю свечи выхода: «после» идёт между золотой и зелёной
  const out = show && ex && afterAll.length && rev >= 1 ? [{ ...line, p: [[n - 0.5 + afterAll.length, lo], [n - 0.5 + afterAll.length, hi]] as [number, number][], c: ex.col, d: null }] : [];
  // окно одно в обоих видах: до правого края, куда дойдут свечи «после» (edge задаёт окно по умолчанию)
  return { v: 1, title: null, texts: [], panels: [{ ...P, bars, xlim: [P.xlim[0], x1], edge: x1, ylim: [lo, hi], shapes: [...P.shapes, line, ...out] }] };
}

function TfBox({ title, k, it, tf, show, when, live, loading, tools, notes = false, children, rev = 1 }: { title: string; k: string; it: TimeItem; tf?: Tf; show: boolean; when: string; live?: Scene | null; loading?: boolean; tools?: ReactNode; notes?: boolean; children?: ReactNode; rev?: number }) {
  const view = useContext(TmViewCtx);
  const [fs, setFs] = useState(false);
  if (!live && !loading && (!tf || !tf.bars.length)) return null;
  const ex = exitLook(it);
  const small = { ...btn(DIM), width: 'auto', marginTop: 0, padding: '5px 10px', fontSize: 10 };
  // 18.10.2026, его слово (школьный бот, холодные): «всё-таки уберём все цифры и все пояснения… для холодного это вообще
  // не нужно… раскрывает то, что не нужно» — в Телеграме без номеров и их списка все три графика (машина времени и
  // тренажёр в Телеграме есть только у школьного бота); в кабинете номера остаются
  // 18.10.2026, его слово про веб-версию: «пояснения тоже мешают… отключить… кнопку: выключить и включить пояснения» —
  // в кабинете по умолчанию без номеров и их списка, кнопкой «показать пояснения» — с ними; в Телеграме — всегда без
  const shown = live && (view.plain || !notes) ? { ...live, panels: live.panels.map((p) => ({ ...p, labels: [] })) } : live;
  const chart = shown ? <LiveChart scene={shown} hidden={NO_HIDDEN} noHead still={view.still} /> : null;
  return (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ ...label }}>{title} · {show ? 'до и после' + (ex ? ' · ' + ex.tag : '') : 'как было ' + when}</div>
        {live ? (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {tools}
            <button style={small} onClick={() => setFs(true)}>⤢ на весь экран</button>
          </div>
        ) : null}
      </div>
      {/* 18.10.2026: пока грузится рисунок бота, простые свечи не показываем — иначе график «меняется» на глазах */}
      {live ? chart : loading ? <div style={{ color: DIM, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>загружаю рисунок…</div> : tf ? <Chart tf={tf} show={show} when={when} keep={keepAfter(tf.bars.slice(tf.cut), k, cutOf(it), it.tf?.H4)} exitCol={ex?.col} rev={rev} /> : null}
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

function Layout({ it, show, side, onOpen, symbols, hidePic, rev = 1 }: { it: TimeItem; show: boolean; side: ReactNode; onOpen: Open; symbols: Set<string>; hidePic?: boolean; rev?: number }) {
  const wide = typeof window === 'undefined' ? true : window.innerWidth >= 900;
  const when = fmtWhen(it.time).slice(0, 5);
  const ex = exitLook(it);
  const ctx = ctxWords(it.ctx);
  const { sc, state } = useScene(it.scene);
  const [notes, setNotes] = useState(false);
  const view = useContext(TmViewCtx);
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
        {!view.plain && sc ? (
          <div>
            <button style={{ ...btn(notes ? ACCENT : DIM), width: 'auto', marginTop: 0, padding: '6px 12px', fontSize: 10 }} onClick={() => setNotes(!notes)}>
              {notes ? 'скрыть пояснения' : 'показать пояснения'}
            </button>
          </div>
        ) : null}
        <TfBox title={`${it.instrument} · H4`} k="H4" it={it} tf={it.tf?.H4} show={show} when={when} live={scenePanel(sc, 'H4', show, all, it, rev)} loading={loading} tools={allBtn} notes={notes} rev={rev}>
          <Rows rows={[['Сигнал', 'триггер на H4 — с него пришла карточка'], ...(it.h4?.rows || [])]} />
          {hidePic ? null : <Pic it={it} />}
        </TfBox>
        <TfBox title={`${it.instrument} · дневка`} k="D1" it={it} tf={it.tf?.D1} show={show} when={when} live={scenePanel(sc, 'D1', show, true, it, rev)} loading={loading} notes={notes} rev={rev}>
          <Rows rows={dayRows(it)} />
        </TfBox>
        <TfBox title={`${it.instrument} · неделя`} k="W1" it={it} tf={it.tf?.W1} show={show} when={when} live={scenePanel(sc, 'W1', show, true, it, rev)} loading={loading} notes={notes} rev={rev}>
          <Rows rows={weekRows(it)} />
        </TfBox>
        <div style={{ color: DIM, fontSize: 12, lineHeight: 1.55 }}>
          Справа от золотой линии — то, чего в момент решения ещё никто не знал. Под каждым графиком — то, что бот видел в момент сигнала.
          {show && ex ? ` Зелёная линия — ${ex.tag}: здесь сделка закрылась, дальше график не показан.` : ''}
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

// день решения по его времени (UTC+5) — так же, как календарь журнала (Feeds.tsx, dayOf)
const dayOfTm = (time: string) => new Date(new Date(time).getTime() + 5 * 3600e3).toISOString().slice(0, 10);

/** ⛔ 21.10.2026, его слово: «Верни машину времени в веб-версию… переименуй в сделки до и после» — вкладка называется
 *  «Сделки до и после» (имя компонента и ленты timemachine прежние). «В машину времени добавь календарь, по которому
 *  легче выбирать допуск/отказ из журнала» — календарь журнала решений (JournalCalendar) без итогов месяца: нажатие на
 *  день открывает решение этого дня. */
export function TimeMachine({ doc, symbols, onOpen }: { doc?: { items?: TimeItem[] }; symbols: Set<string>; onOpen: Open }) {
  // 18.10.2026: форекс и крипта — переключателем, как в журнале решений
  const [mk, setMk] = useState<MarketKey>('fx');
  const all = useMemo(() => [...(doc?.items || [])].filter((x) => x.tf?.D1).sort((a, b) => b.time.localeCompare(a.time)), [doc]);
  const items = useMemo(() => all.filter((x) => marketOfSym(x.instrument) === mk), [all, mk]);
  const counts = { fx: all.filter((x) => marketOfSym(x.instrument) === 'fx').length, crypto: all.filter((x) => marketOfSym(x.instrument) === 'crypto').length };
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  // 25.10.2026, идея 6 «что было дальше проигрывается»: по кнопке свечи после решения появляются одна за другой
  // (все три графика за REVEAL_MS), линия выхода вспыхивает в конце, итог — когда рынок «дошёл» до него
  const [rev, setRev] = useState(1);
  const revTimer = useRef(0);
  useEffect(() => () => window.clearInterval(revTimer.current), []);
  const hide = () => {
    window.clearInterval(revTimer.current);
    setShown(false);
    setRev(1);
  };
  const reveal = () => {
    window.clearInterval(revTimer.current);
    setShown(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setRev(1); return; }
    const t0 = performance.now();
    setRev(0);
    revTimer.current = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / REVEAL_MS);
      setRev(p);
      if (p >= 1) window.clearInterval(revTimer.current);
    }, 60);
  };
  const pick = (m: MarketKey) => {
    setMk(m);
    setIdx(0);
    hide();
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
      <JournalCalendar
        items={items}
        resultOf={(x) => x.result}
        stats={false}
        hint="Число — результат сделки в R: 1 R — это один стоп. Рамкой — решение без входа. Нажмите на число — откроется эта сделка; на день без сделки — первое решение дня. Другие решения того же дня — в ленте ниже, в пунктирной рамке."
        onPick={(day, x) => {
          // ⛔ 21.10.2026: открываем то решение, на которое нажали (квадратик сделки или сделку дня), а не первое в ленте
          const i = x ? items.indexOf(x) : items.findIndex((y) => dayOfTm(y.time) === day);
          if (i < 0) return;
          setIdx(i);
          hide();
          window.setTimeout(() => {
            document.getElementById('tm-pick-' + i)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            document.getElementById('tm-picks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 0);
        }}
      />
      <div id="tm-picks" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 6, scrollMarginTop: 8 }}>
        {items.map((x, i) => (
          <button
            id={'tm-pick-' + i}
            key={keyOf(x)}
            onClick={() => {
              setIdx(i);
              hide();
            }}
            // другие решения того же дня, что и открытое, — в пунктирной рамке: видно, что в этот день их было несколько
            style={{ flex: '0 0 auto', textAlign: 'left', background: CARD, border: i === idx ? `1px solid ${ACCENT}` : dayOfTm(x.time) === dayOfTm(it.time) ? `1px dashed ${ACCENT}99` : `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: FG }}
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
        rev={rev}
        symbols={symbols}
        onOpen={onOpen}
        side={
          <>
            <Stamp it={it} />
            {!shown ? (
              <button style={btn()} onClick={reveal}>Что было дальше →</button>
            ) : rev >= 1 ? (
              <div className="eg-rise"><Result it={it} /></div>
            ) : (
              <div style={{ ...label, color: ACCENT, marginTop: 12 }}>рынок идёт дальше…</div>
            )}
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
