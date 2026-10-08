import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Bitcoin, Search } from 'lucide-react';
import { ACCENT, BORDER, CRYPTO, CRYPTO_TEXT, DIM, DOWN, FG, MONO, SANS, UP, card, label } from './theme';
import { ALPHA_TIP, CritMarks, SymbolName, type MarketRow } from './parts';
import { GEN } from './screenerParse';
import { groupRows, scenarioRows, type ScenBlock, type ScenKey } from './sidebarRows';

/**
 * Боковая панель терминала: список инструментов в двух видах.
 *
 * 01.10.2026, его слово: «в боковой панели, где находятся все инструменты, было две вкладки. Первая — как
 * сейчас, все инструменты по группам. И вкладка, где инструменты разбиты по сценариям… по первому сценарию
 * инструменты и по второму… где меньше инструментов, оно должно быть в начале… надо, чтобы написано было:
 * первый и второй сценарий… сделай это красиво». Экран по-прежнему ничего не считает: сценарий, сторона
 * и подтверждение приходят готовыми в строке инструмента.
 */

// слова разделов — те же, что в главном блоке инструмента (Decision)
const SCEN_META: Record<ScenKey, { title: string; note?: string }> = {
  '1': { title: 'Первый сценарий', note: 'идём по недельному циклу' },
  '2': { title: 'Второй сценарий', note: 'недельный цикл пройден, идём против него' },
  ctx: { title: 'По контексту', note: 'сценария 1 и 2 нет, но поводырь, дневка и подтверждение за' },
  none: { title: 'Сценария нет' },
};

const PLATE = '#191613';
const sideColor = (s: MarketRow['side']) => (s === 'LONG' ? UP : s === 'SHORT' ? DOWN : BORDER);

const SIDE_CSS = `
.tm-seg button:focus-visible { outline: 1px solid ${ACCENT}; outline-offset: 2px; }
.tm-side-row:focus-visible { outline: 1px solid ${ACCENT}99; outline-offset: -1px; }
@keyframes tmSideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.tm-side-list { animation: tmSideIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1); }
@media (prefers-reduced-motion: reduce) {
  .tm-side-list { animation: none; }
  .tm-seg * { transition: none !important; }
}
.tm-side-scroll { scrollbar-width: thin; scrollbar-color: #4a443b transparent; }
.tm-side-scroll::-webkit-scrollbar { width: 8px; }
.tm-side-scroll::-webkit-scrollbar-thumb { background: #4a443b; border-radius: 4px; }
.tm-side-scroll::-webkit-scrollbar-track { background: transparent; }
`;

export type SideMode = 'groups' | 'scen';
const MODE_KEY = 'tm_side_mode';
const MODES: [SideMode, string][] = [
  ['groups', 'Группы'],
  ['scen', 'Сценарии'],
];

// ⛔ 04.10.2026, его слово: «как красиво отделить крипту от Форекса… делай первый вариант, с переключателем рынка».
// Сверху панели — рынок: «Форекс» (валюты, металлы, индексы, нефть) или «Крипта» (группа крипты); у крипты свой
// фиолетовый цвет, чтобы рынок было видно сразу. «Группы» и «Сценарии» — внутри рынка.
// ⛔ В тот же день: «цифры надо вообще убрать» — на кнопках только знак и слово, без числа инструментов и без бейджа.
export type Market = 'fx' | 'crypto';
const MARKET_KEY = 'tm_side_market';
const isCrypto = (r: MarketRow) => r.group_key === 'BTC' || /USDT$/i.test(r.symbol);
const marketOf = (r: MarketRow): Market => (isCrypto(r) ? 'crypto' : 'fx');
// цвета рынка: плашка и заголовки, подпись «поводырь», фон выбранной строки
const LOOK: Record<Market, { accent: string; text: string; sel: string; name: string; tip: string }> = {
  fx: { accent: ACCENT, text: ACCENT, sel: '#221d16', name: 'Форекс', tip: 'валюты, металлы, индексы и нефть' },
  crypto: { accent: CRYPTO, text: CRYPTO_TEXT, sel: '#1b1830', name: 'Крипта', tip: 'группа крипты' },
};

/** Знак форекса, его слово 04.10.2026: «доллар в центре, а вокруг него основные валюты — йена, евро, фунт,
 *  можно ещё франк». Доллар в кружке, вокруг по сторонам €, £, ¥, ₣; цвет — от кнопки. */
function ForexEmblem({ size }: { size: number }) {
  const around: [string, number, number][] = [
    ['€', 12, 2.9],
    ['£', 21.1, 12.4],
    ['¥', 12, 21.6],
    ['₣', 2.9, 12.4],
  ];
  const font = "Arial, 'Segoe UI', sans-serif";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <text x="12" y="12.5" textAnchor="middle" dominantBaseline="middle" fontSize="8.4" fontWeight="700" fill="currentColor" fontFamily={font}>
        $
      </text>
      {around.map(([g, x, y]) => (
        <text key={g} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="6.2" fontWeight="700" fill="currentColor" fontFamily={font}>
          {g}
        </text>
      ))}
    </svg>
  );
}

/** Переключатель рынка: плашка цвета рынка ездит между «Форекс» и «Крипта». Только знак и слово, цифр нет. */
function MarketSwitch({ market, onChange }: { market: Market; onChange: (m: Market) => void }) {
  const items: [Market, ReactNode][] = [
    ['fx', <ForexEmblem key="i" size={26} />],
    ['crypto', <Bitcoin key="i" size={18} aria-hidden style={{ flexShrink: 0 }} />],
  ];
  return (
    <div
      className="tm-seg"
      role="tablist"
      aria-label="рынок"
      style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 3, borderRadius: 9, border: `1px solid ${BORDER}`, backgroundColor: '#0d0c0b', marginBottom: 6 }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 3,
          width: 'calc(50% - 3px)',
          borderRadius: 6,
          backgroundColor: LOOK[market].accent,
          transform: `translateX(${market === 'crypto' ? '100%' : '0'})`,
          transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 180ms',
        }}
      />
      {items.map(([m, icon]) => {
        const on = market === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(m)}
            title={`${LOOK[m].name}: ${LOOK[m].tip}`}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '4px 4px',
              minHeight: 34,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: on ? '#0a0a0a' : DIM,
              transition: 'color 180ms',
            }}
          >
            {icon}
            <span>{LOOK[m].name}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Переключатель вида: с 04.10.2026 — второй, под рынком, поэтому тише: тёмная плашка, светлое слово. */
function ModeSwitch({ mode, onChange }: { mode: SideMode; onChange: (m: SideMode) => void }) {
  return (
    <div
      className="tm-seg"
      role="tablist"
      aria-label="как разложить список инструментов"
      style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 3, borderRadius: 9, border: '1px solid #1c1a17', backgroundColor: '#0d0c0b', marginBottom: 8 }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 3,
          width: 'calc(50% - 3px)',
          borderRadius: 6,
          backgroundColor: '#2a241b',
          transform: `translateX(${mode === 'scen' ? '100%' : '0'})`,
          transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
      {MODES.map(([m, name]) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '6px 6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: mode === m ? FG : DIM,
            transition: 'color 180ms',
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/** Строка инструмента — одна на оба вида. edge — цветная полоска стороны слева (вид «сценарии»).
 *  market — чьими цветами подсвечивать выбранную строку и подпись «поводырь». */
function InstrumentRow({ r, on, guide, tip, edge, market, onOpen }: { r: MarketRow; on: boolean; guide: boolean; tip?: string; edge?: string; market: Market; onOpen: (sym: string) => void }) {
  return (
    <button
      className="tm-side-row"
      aria-current={on ? 'true' : undefined}
      onClick={() => onOpen(r.symbol)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        textAlign: 'left',
        padding: edge ? '8px 8px 8px 12px' : '8px 8px',
        borderRadius: 8,
        backgroundColor: on ? LOOK[market].sel : 'transparent',
        border: `1px solid ${on ? `${LOOK[market].accent}55` : 'transparent'}`,
        cursor: 'pointer',
        color: FG,
      }}
    >
      {edge ? <span aria-hidden style={{ position: 'absolute', left: 3, top: 9, bottom: 9, width: 3, borderRadius: 2, backgroundColor: edge }} /> : null}
      {/* 24.09.2026, его слово: в группе доллара слово «поводырь» только у индекса доллара,
          и без ALPHA; поводыри других групп — без пометки (в своей группе она остаётся).
          26.09.2026: слово — под названием, по центру (рядом с ним не влезала цена) */}
      <SymbolName symbol={r.symbol} guide={guide} tip={tip} color={LOOK[market].text} />
      <CritMarks r={r} />
      <span style={{ fontFamily: MONO, fontSize: 11, color: DIM, minWidth: 62, textAlign: 'right' }}>{r.price_text || '—'}</span>
    </button>
  );
}

const leadTip = (r: MarketRow) =>
  r.extra?.leads === 'DXY' ? ALPHA_TIP : `главный в группе ${GEN[r.extra?.leads || ''] || r.extra?.leads || ''}`; // 03.10.2026, его слово: вместо «сам — поводырь группы»

/** Шапка первого и второго сценария: слева крупно — сколько в сценарии инструментов, справа название словами
 *  и чем сценарий живёт, ниже полоска «сколько из них LONG и сколько SHORT».
 *  01.10.2026 вечер, его поправка: «если написано второй сценарий… не знаю, зачем тогда 1 и 2… убрать цифру 1 и 2,
 *  а общее количество поставить где были 1 и 2, с левой стороны… пояснение немножко сдвинуть вправо и немножко
 *  увеличить… но не сильно крупно, чтобы не портило эстетику» — крупного номера сценария больше нет, на его
 *  месте число инструментов (раньше оно стояло мелко справа). */
function ScenPlate({ b, market }: { b: ScenBlock; market: Market }) {
  const meta = SCEN_META[b.key];
  // счёт — по всему сценарию, не по найденному: шапка от поиска не меняется
  const { long, short } = b;
  const rest = b.total - long - short;
  return (
    <div style={{ margin: '10px 0 4px', padding: '11px 11px 10px', borderRadius: 10, backgroundColor: PLATE, border: `1px solid ${LOOK[market].accent}33` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 15, alignItems: 'center' }}>
        <span
          title="инструментов в сценарии"
          style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, lineHeight: 0.9, minWidth: 24, textAlign: 'center', color: b.total ? LOOK[market].text : DIM }}
        >
          {b.total}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FG }}>{meta.title}</div>
          {/* строки пояснения — ровными по длине, без одинокого слова на второй строке */}
          <div style={{ fontSize: 12, color: DIM, lineHeight: 1.35, marginTop: 4, textWrap: 'balance' }}>{meta.note}</div>
        </div>
      </div>
      {b.total ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 2, height: 4 }}>
            {long ? <span style={{ flex: long, backgroundColor: UP, borderRadius: 2 }} /> : null}
            {short ? <span style={{ flex: short, backgroundColor: DOWN, borderRadius: 2 }} /> : null}
            {rest ? <span style={{ flex: rest, backgroundColor: BORDER, borderRadius: 2 }} /> : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em' }}>
            <span style={{ color: UP }}>{long ? `LONG ${long}` : ''}</span>
            <span style={{ color: DOWN }}>{short ? `SHORT ${short}` : ''}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: DIM, marginTop: 8 }}>сейчас инструментов нет</div>
      )}
    </div>
  );
}

function SubCap({ text, n }: { text: string; n: number }) {
  return (
    <div style={{ ...label, letterSpacing: '0.14em', display: 'flex', justifyContent: 'space-between', padding: '9px 8px 3px' }}>
      <span>{text}</span>
      <span>{n}</span>
    </div>
  );
}

function ScenarioList({ blocks, searching, selected, market, onOpen }: { blocks: ScenBlock[]; searching: boolean; selected: string | null; market: Market; onOpen: (sym: string) => void }) {
  const row = (r: MarketRow) => (
    <InstrumentRow key={r.symbol} r={r} on={selected === r.symbol} guide={!!r.extra?.leads} tip={leadTip(r)} edge={sideColor(r.side)} market={market} onOpen={onOpen} />
  );
  const any = blocks.some((b) => b.rows.length);
  if (!any && searching) return null; // «не найдено» и подсказку про другой рынок пишет сама панель
  return (
    <>
      {blocks.map((b) => {
        const numbered = b.key === '1' || b.key === '2';
        // пока идёт поиск, пустые разделы не показываем; «по контексту» и «сценария нет» — только когда в них кто-то есть
        if (!b.rows.length && (searching || !numbered)) return null;
        const yes = b.rows.filter((r) => r.confirmation);
        const no = b.rows.filter((r) => !r.confirmation);
        return (
          <div key={b.key} style={{ marginBottom: 6 }}>
            {numbered ? (
              <ScenPlate b={b} market={market} />
            ) : (
              <div style={{ padding: '14px 8px 2px' }}>
                <div style={{ ...label, color: b.key === 'ctx' ? LOOK[market].text : DIM, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{SCEN_META[b.key].title}</span>
                  <span>{b.total}</span>
                </div>
                {SCEN_META[b.key].note ? <div style={{ fontSize: 11, color: DIM, lineHeight: 1.35, marginTop: 4 }}>{SCEN_META[b.key].note}</div> : null}
              </div>
            )}
            {numbered ? (
              <>
                {yes.length ? <SubCap text="с подтверждением" n={yes.length} /> : null}
                {yes.map(row)}
                {no.length ? <SubCap text="без подтверждения" n={no.length} /> : null}
                {no.map(row)}
              </>
            ) : (
              b.rows.map(row)
            )}
          </div>
        );
      })}
    </>
  );
}

function readMode(): SideMode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'scen' ? 'scen' : 'groups';
  } catch {
    return 'groups';
  }
}

function readMarket(): Market {
  try {
    return window.localStorage.getItem(MARKET_KEY) === 'crypto' ? 'crypto' : 'fx';
  } catch {
    return 'fx';
  }
}

export default function TerminalSidebar({
  rows,
  list,
  query,
  onQuery,
  selected,
  onOpen,
  wide,
  trial = false,
}: {
  rows: MarketRow[];
  list: MarketRow[];
  query: string;
  onQuery: (q: string) => void;
  selected: string | null;
  onOpen: (sym: string) => void;
  wide: boolean;
  trial?: boolean;
}) {
  const [mode, setMode] = useState<SideMode>(readMode);
  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* закрытое окно браузера — вид просто не запомнится */
    }
  }, [mode]);
  const [market, setMarket] = useState<Market>(readMarket);
  useEffect(() => {
    try {
      window.localStorage.setItem(MARKET_KEY, market);
    } catch {
      /* закрытое окно браузера — рынок просто не запомнится */
    }
  }, [market]);
  // открыли инструмент другого рынка (из скринера, ТОП-листа, журнала) — список переходит на его рынок.
  // Только при смене инструмента: вернулся на ту же вкладку с тем же инструментом — выбранный вручную рынок стоит
  const lastSel = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || selected === lastSel.current) return;
    const r = rows.find((x) => x.symbol === selected);
    if (!r) return; // строки витрины ещё не пришли
    lastSel.current = selected;
    setMarket(marketOf(r));
  }, [selected, rows]);
  const rowsM = useMemo(() => rows.filter((r) => marketOf(r) === market), [rows, market]);
  const listM = useMemo(() => list.filter((r) => marketOf(r) === market), [list, market]);
  const other: Market = market === 'fx' ? 'crypto' : 'fx';
  const searching = query.trim() !== '';
  const otherHits = searching ? list.length - listM.length : 0;
  // кто кого ведёт — по всем строкам, показываем только свой рынок.
  // 08.10.2026, его слово (кабинет глазами подписчика): «фунт-доллар почему-то дублируется… в пробном доступе убрать
  // группу фунта и убрать группу золота… пускай три инструмента в группе доллара будут». Поводырь с долларом в имени
  // стоит и в своей группе, и в группе доллара; в пробном доступе каждый инструмент — один раз: кто есть в группе
  // доллара, стоит только там
  const groupedList = useMemo(() => {
    const g = groupRows(rows, listM);
    if (!trial) return g;
    const inDxy = new Set((g.find(([k]) => k === 'DXY')?.[1] || []).map((r) => r.symbol));
    return g
      .map(([k, rs]): [string, MarketRow[]] => [k, k === 'DXY' ? rs : rs.filter((r) => !inDxy.has(r.symbol))])
      .filter(([, rs]) => rs.length > 0);
  }, [rows, listM, trial]);
  const blocks = useMemo(() => scenarioRows(rowsM, listM), [rowsM, listM]);
  // 03.10.2026: на компьютере список листается внутри — выбранный инструмент держим в поле видимости списка
  // (двигается только сам список, страница стоит на месте)
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scroller.current;
    if (!wide || !box) return;
    const el = box.querySelector<HTMLElement>('[aria-current="true"]');
    if (!el) return;
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < b.top || r.bottom > b.bottom) box.scrollTop += r.top - b.top - b.height / 3;
  }, [selected, mode, wide, market]);

  return (
    // 21.09.2026, его слово: на компьютере список — до низа, до дисклеймера, без ползунка.
    // ⛔ 03.10.2026, его слово: «мы добавили инструменты и список увеличился. Надо сделать прокрутку, как на планшете,
    // как на телефоне… чтобы список заканчивался вместе с графиком… если список не помещается, нужна прокрутка» —
    // на компьютере панель высотой с ряд графика (её обёртка в SchoolTerminal не задаёт высоту ряда), переключатель,
    // поиск и подпись стоят, листается только список. На телефоне и планшете — как было: вся панель 320 px с прокруткой.
    <div
      style={{
        ...card,
        padding: 10,
        ...(wide
          ? { height: '100%', boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column' as const }
          : { maxHeight: 320, overflowY: 'auto' as const }),
      }}
    >
      <style>{SIDE_CSS}</style>
      <MarketSwitch market={market} onChange={setMarket} />
      <ModeSwitch mode={mode} onChange={setMode} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 10px' }}>
        <Search size={14} color={DIM} />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="поиск инструмента"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: FG, fontFamily: SANS, fontSize: 13 }}
        />
      </div>
      {/* 22.09.2026, его вопрос «что обозначают стрелочки?» — подпись прямо над списком;
          26.09.2026, его слово: не накопления, а итог — неделя, дневка и подтверждение дневки */}
      <div style={{ ...label, letterSpacing: '0.08em', textTransform: 'none', padding: '0 8px 4px', lineHeight: 1.5 }}>
        Н — неделя, Д — дневка: итог критериев · П — подтверждение дневки · ↑ вверх · ↓ вниз · ~ спор или нет
      </div>
      <div
        key={`${market}-${mode}`}
        ref={scroller}
        className={wide ? 'tm-side-list tm-side-scroll' : 'tm-side-list'}
        role="tabpanel"
        style={wide ? { flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2 } : undefined}
      >
        {/* поиск ищет на выбранном рынке; нашлось только на другом — так и пишем, одним нажатием туда */}
        {searching && !listM.length ? (
          <div style={{ color: DIM, fontSize: 12, padding: '12px 8px', lineHeight: 1.5 }}>
            {otherHits ? (
              <button
                onClick={() => setMarket(other)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: `1px solid ${LOOK[other].accent}55`, color: LOOK[other].text, fontFamily: SANS, fontSize: 12 }}
              >
                {`На рынке «${LOOK[market].name}» не нашлось. Есть на рынке «${LOOK[other].name}» — показать`}
              </button>
            ) : (
              'По такому названию инструмента нет.'
            )}
          </div>
        ) : null}
        {mode === 'groups' ? (
          groupedList.map(([g, rs]) => (
            <div key={g} style={{ marginBottom: 6 }}>
              <div style={{ ...label, color: LOOK[market].text, padding: '10px 8px 4px' }}>{GEN[g] ? `Группа ${GEN[g]}` : 'Группа без поводыря'}</div>
              {rs.map((r) => (
                <InstrumentRow
                  key={r.symbol}
                  r={r}
                  on={selected === r.symbol}
                  guide={!!r.extra?.leads && (g !== 'DXY' || r.extra.leads === 'DXY')}
                  tip={leadTip(r)}
                  market={market}
                  onOpen={onOpen}
                />
              ))}
            </div>
          ))
        ) : (
          <ScenarioList blocks={blocks} searching={searching} selected={selected} market={market} onOpen={onOpen} />
        )}
      </div>
    </div>
  );
}
