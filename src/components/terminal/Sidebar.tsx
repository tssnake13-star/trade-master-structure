import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ACCENT, BORDER, DIM, DOWN, FG, MONO, SANS, UP, card, label } from './theme';
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
const SCEN_META: Record<ScenKey, { n?: string; title: string; note?: string }> = {
  '1': { n: '1', title: 'Первый сценарий', note: 'идём по недельному циклу' },
  '2': { n: '2', title: 'Второй сценарий', note: 'недельный цикл пройден, идём против него' },
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
`;

export type SideMode = 'groups' | 'scen';
const MODE_KEY = 'tm_side_mode';
const MODES: [SideMode, string][] = [
  ['groups', 'Группы'],
  ['scen', 'Сценарии'],
];

/** Переключатель вида: одна золотая плашка ездит между двумя словами. */
function ModeSwitch({ mode, onChange }: { mode: SideMode; onChange: (m: SideMode) => void }) {
  return (
    <div
      className="tm-seg"
      role="tablist"
      aria-label="как разложить список инструментов"
      style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 3, borderRadius: 9, border: `1px solid ${BORDER}`, backgroundColor: '#0d0c0b', marginBottom: 8 }}
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
          backgroundColor: ACCENT,
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
            padding: '7px 6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: mode === m ? '#0a0a0a' : DIM,
            transition: 'color 180ms',
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/** Строка инструмента — одна на оба вида. edge — цветная полоска стороны слева (вид «сценарии»). */
function InstrumentRow({ r, on, guide, tip, edge, onOpen }: { r: MarketRow; on: boolean; guide: boolean; tip?: string; edge?: string; onOpen: (sym: string) => void }) {
  return (
    <button
      className="tm-side-row"
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
        backgroundColor: on ? '#221d16' : 'transparent',
        border: `1px solid ${on ? `${ACCENT}55` : 'transparent'}`,
        cursor: 'pointer',
        color: FG,
      }}
    >
      {edge ? <span aria-hidden style={{ position: 'absolute', left: 3, top: 9, bottom: 9, width: 3, borderRadius: 2, backgroundColor: edge }} /> : null}
      {/* 24.09.2026, его слово: в группе доллара слово «поводырь» только у индекса доллара,
          и без ALPHA; поводыри других групп — без пометки (в своей группе она остаётся).
          26.09.2026: слово — под названием, по центру (рядом с ним не влезала цена) */}
      <SymbolName symbol={r.symbol} guide={guide} tip={tip} />
      <CritMarks r={r} />
      <span style={{ fontFamily: MONO, fontSize: 11, color: DIM, minWidth: 62, textAlign: 'right' }}>{r.price_text || '—'}</span>
    </button>
  );
}

const leadTip = (r: MarketRow) =>
  r.extra?.leads === 'DXY' ? ALPHA_TIP : `сам — поводырь группы ${GEN[r.extra?.leads || ''] || r.extra?.leads || ''}`;

/** Шапка первого и второго сценария: крупный номер, название, чем сценарий живёт, сколько инструментов
 *  и полоска «сколько из них LONG и сколько SHORT». */
function ScenPlate({ b }: { b: ScenBlock }) {
  const meta = SCEN_META[b.key];
  // счёт — по всему сценарию, не по найденному: шапка от поиска не меняется
  const { long, short } = b;
  const rest = b.total - long - short;
  return (
    <div style={{ margin: '10px 0 4px', padding: '11px 11px 10px', borderRadius: 10, backgroundColor: PLATE, border: `1px solid ${ACCENT}33` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', columnGap: 11, alignItems: 'center' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, lineHeight: 0.85, color: ACCENT }}>{meta.n}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: FG }}>{meta.title}</div>
          <div style={{ fontSize: 11, color: DIM, lineHeight: 1.35, marginTop: 3 }}>{meta.note}</div>
        </div>
        <span title="инструментов в сценарии" style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: b.total ? ACCENT : DIM, alignSelf: 'start' }}>
          {b.total}
        </span>
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

function ScenarioList({ blocks, searching, selected, onOpen }: { blocks: ScenBlock[]; searching: boolean; selected: string | null; onOpen: (sym: string) => void }) {
  const row = (r: MarketRow) => (
    <InstrumentRow key={r.symbol} r={r} on={selected === r.symbol} guide={!!r.extra?.leads} tip={leadTip(r)} edge={sideColor(r.side)} onOpen={onOpen} />
  );
  const any = blocks.some((b) => b.rows.length);
  if (!any && searching) return <div style={{ color: DIM, fontSize: 12, padding: '12px 8px' }}>По такому названию инструмента нет.</div>;
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
              <ScenPlate b={b} />
            ) : (
              <div style={{ padding: '14px 8px 2px' }}>
                <div style={{ ...label, color: b.key === 'ctx' ? ACCENT : DIM, display: 'flex', justifyContent: 'space-between' }}>
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

export default function TerminalSidebar({
  rows,
  list,
  query,
  onQuery,
  selected,
  onOpen,
  wide,
}: {
  rows: MarketRow[];
  list: MarketRow[];
  query: string;
  onQuery: (q: string) => void;
  selected: string | null;
  onOpen: (sym: string) => void;
  wide: boolean;
}) {
  const [mode, setMode] = useState<SideMode>(readMode);
  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* закрытое окно браузера — вид просто не запомнится */
    }
  }, [mode]);
  const groupedList = useMemo(() => groupRows(rows, list), [rows, list]);
  const blocks = useMemo(() => scenarioRows(rows, list), [rows, list]);

  return (
    // 21.09.2026, его слово: на компьютере список — до низа, до дисклеймера, без ползунка
    <div style={{ ...card, padding: 10, ...(wide ? {} : { maxHeight: 320, overflowY: 'auto' as const }) }}>
      <style>{SIDE_CSS}</style>
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
      <div key={mode} className="tm-side-list" role="tabpanel">
        {mode === 'groups' ? (
          groupedList.map(([g, rs]) => (
            <div key={g} style={{ marginBottom: 6 }}>
              <div style={{ ...label, color: ACCENT, padding: '10px 8px 4px' }}>{GEN[g] ? `Группа ${GEN[g]}` : 'Группа без поводыря'}</div>
              {rs.map((r) => (
                <InstrumentRow
                  key={r.symbol}
                  r={r}
                  on={selected === r.symbol}
                  guide={!!r.extra?.leads && (g !== 'DXY' || r.extra.leads === 'DXY')}
                  tip={leadTip(r)}
                  onOpen={onOpen}
                />
              ))}
            </div>
          ))
        ) : (
          <ScenarioList blocks={blocks} searching={query.trim() !== ''} selected={selected} onOpen={onOpen} />
        )}
      </div>
    </div>
  );
}
