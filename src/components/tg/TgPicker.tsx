import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import DropGroup from '@/components/cabinet2/DropGroup';
import { Beam, type MarketRow } from '@/components/terminal/parts';
import { SCEN_META, groupRows, scenarioRows } from '@/components/terminal/sidebarRows';
import { GEN } from '@/components/terminal/screenerParse';
import { UP, DOWN } from '@/components/terminal/theme';

/** 18.10.2026, его слово: «листать ленту вправо… неудобно… давай твой вариант посмотрим по группам». Инструменты
 *  плитками с переносом, по группам в порядке боковой панели кабинета (groupRows), сторона — цветом; список
 *  сворачивается кнопкой с выбранным инструментом, чтобы на телефоне не занимал весь экран.
 *  29.10.2026: ночной облик терминала v2 (tg-v2.css) — плитки стеклом, выбранная с лучом по рамке, «Группы / Сценарии»
 *  каплей (DropGroup), как в кабинете. Порядок, группы, сценарии и память выбора — прежние. */
const PICK_MODE = 'tg_pick_mode';

export default function TgPicker({ rows, cur, onPick }: { rows: MarketRow[]; cur: MarketRow; onPick: (s: string) => void }) {
  const few = rows.length <= 6;
  const [open, setOpen] = useState(false);
  // 18.10.2026, его слово: «в терминале Телеграма, где вкладка инструменты… нету кнопок группы и сценарии. Можешь
  // сделать сортировку по группам и по сценариям?» — те же два вида, что в кабинете; выбор запоминается
  const [mode, setModeState] = useState<'groups' | 'scen'>(() => {
    try {
      return window.localStorage.getItem(PICK_MODE) === 'scen' ? 'scen' : 'groups';
    } catch {
      return 'groups';
    }
  });
  const setMode = (m: 'groups' | 'scen') => {
    setModeState(m);
    try {
      window.localStorage.setItem(PICK_MODE, m);
    } catch {
      /* без памяти браузера — просто не запомним */
    }
  };
  const cap = (t: string) => <div className="tg-pick-cap">{t}</div>;
  // 18.10.2026, его слово: «выделить поводырей… а то они все сливаются в одно» — поводырь своей группы в латунной рамке
  const chip = (x: MarketRow, lead = false) => {
    const on = x.symbol === cur.symbol;
    return (
      <button
        key={x.symbol}
        type="button"
        aria-pressed={on}
        onClick={() => {
          onPick(x.symbol);
          setOpen(false);
        }}
        className={`tg-chip tm-sel${on ? ' on' : ''}${lead ? ' lead' : ''}`}
      >
        {lead ? <span className="tg-chip-star">★</span> : null}
        {x.symbol}
        {/* сторона — зелёным и красным, как на картинках бота */}
        {x.side ? <span className="tg-chip-side" style={{ color: x.side === 'LONG' ? UP : DOWN }}>{x.side === 'LONG' ? '▲' : '▼'}</span> : null}
        {/* 25.10.2026, его «да» на список из веб-версии: по выбранному бежит луч, как в кабинете */}
        {on ? <Beam fit="in" phase={0.6} /> : null}
      </button>
    );
  };
  if (few) return <div className="tg-chips tg-pick-few">{rows.map((x) => chip(x))}</div>;
  return (
    <div className={open ? 'tg-pick open' : 'tg-pick'}>
      <button type="button" className="tg-pick-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          Инструменты · <b className="num">{cur.symbol}</b>
        </span>
        <ChevronDown size={16} className="tg-pick-arrow" aria-hidden="true" />
      </button>
      {open ? (
        <div className="tg-pick-list">
          <DropGroup
            variant="sm"
            className="tg-seg"
            label="Порядок инструментов"
            value={mode}
            onChange={setMode}
            items={[{ key: 'groups', label: 'Группы' }, { key: 'scen', label: 'Сценарии' }]}
          />
          {mode === 'scen'
            ? scenarioRows(rows, rows)
                .filter((b) => b.rows.length)
                .map((b) => {
                  const numbered = b.key === '1' || b.key === '2';
                  const yes = numbered ? b.rows.filter((x) => x.confirmation) : b.rows;
                  const no = numbered ? b.rows.filter((x) => !x.confirmation) : [];
                  return (
                    <div key={b.key} className="tg-pick-block">
                      <div className="tg-pick-h">
                        {SCEN_META[b.key].title}
                        <span className="tg-pick-n"> · {b.total}</span>
                      </div>
                      {SCEN_META[b.key].note ? <div className="tg-pick-note">{SCEN_META[b.key].note}</div> : null}
                      {numbered && yes.length ? cap(`с подтверждением · ${yes.length}`) : null}
                      {yes.length ? <div className={numbered ? 'tg-chips' : 'tg-chips tg-chips-gap'}>{yes.map((x) => chip(x))}</div> : null}
                      {no.length ? cap(`без подтверждения · ${no.length}`) : null}
                      {no.length ? <div className="tg-chips">{no.map((x) => chip(x))}</div> : null}
                    </div>
                  );
                })
            : groupRows(rows, rows).map(([g, rs]) => {
                const lead = rs.find((x) => x.extra?.leads === g);
                return (
                  <div key={g} className="tg-pick-block">
                    <div className="tg-pick-h tg-pick-h-gap">
                      {g === 'NONE' ? 'Без поводыря' : `Группа ${GEN[g] || g}`}
                      {lead ? <span className="tg-pick-n"> · поводырь ★ {lead.symbol}</span> : null}
                    </div>
                    <div className="tg-chips">{rs.map((x) => chip(x, x.extra?.leads === g))}</div>
                  </div>
                );
              })}
        </div>
      ) : null}
    </div>
  );
}
