import { useState, type ReactNode } from 'react';
import { ACCENT, BORDER, DIM, DOWN, FG, MONO, UP, card, label, fmtWhen } from './theme';
import { GEN } from './screenerParse';

/**
 * История направления — его слово 25.09.2026: «показывать не один день, а изменения… эффективность определения
 * направления… где ошибается система, где не ошибается… чтобы фиксировалось день за днём и сохранялось».
 * Мост каждый полный круг записывает сторону карточки по каждому инструменту (день — последняя закрытая дневка).
 * Вызов — дни подряд с одной стороной; итог — куда цена первой прошла 2 средних дневных хода от начала вызова
 * (мерило субботней сводки). Экран ничего не считает, только раскладывает ленту history.
 */

export interface HistCall {
  symbol: string;
  side: 'LONG' | 'SHORT';
  day: string; // первый день вызова (дата последней закрытой дневки)
  start: string; // круг, где сторона появилась
  last: string;
  end: string | null; // день, когда сторона сменилась или пропала
  scenario: string;
  conf: boolean;
  w_dir: string;
  d_dir: string;
  first: boolean; // сторона уже стояла на начало записи
  status: string; // по направлению · против · пока не решила · не решила · нет свечей
  fav: number | null;
  adv: number | null;
  group?: string | null;
}

export interface HistoryDoc {
  since?: string;
  days?: string[];
  rows?: Record<string, string>;
  calls?: HistCall[];
  at?: string;
}

type Open = (symbol: string) => void;

const SHOW_DAYS = 60;
const stColor = (s: string) => (s === 'по направлению' ? UP : s === 'против' ? DOWN : s === 'пока не решила' ? ACCENT : DIM);
const mark = (s: string) => (s === 'по направлению' ? '✓' : s === 'против' ? '✗' : s === 'пока не решила' ? '•' : '·');
const dd = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
const num = (x: number | null | undefined) => (x == null ? '—' : (Math.round(x * 10) / 10).toFixed(1).replace('.', ','));
const cellBg = (ch: string) => (ch === 'L' ? `${UP}cc` : ch === 'S' ? `${DOWN}cc` : ch === '-' ? '#2a2622' : 'transparent');
const weekRel = (c: HistCall) =>
  c.w_dir === c.side ? 'неделя за' : c.w_dir === 'LONG' || c.w_dir === 'SHORT' ? 'неделя против' : 'неделя в споре';

interface Tally {
  n: number;
  ok: number;
  bad: number;
  open: number;
}
const tally = (cs: HistCall[]): Tally => ({
  n: cs.length,
  ok: cs.filter((c) => c.status === 'по направлению').length,
  bad: cs.filter((c) => c.status === 'против').length,
  open: cs.filter((c) => c.status === 'пока не решила').length,
});
const share = (t: Tally) => (t.ok + t.bad ? `${Math.round((t.ok / (t.ok + t.bad)) * 100)}%` : '—');

/** Полоска одного инструмента: день — клетка цветом стороны, в клетке начала вызова — его итог. */
function Strip({ days, line, starts }: { days: string[]; line: string; starts: Map<string, HistCall> }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {days.map((d, i) => {
        const c = starts.get(d);
        const ch = line[i] || ' ';
        return (
          <div
            key={d}
            title={`${dd(d)} · ${ch === 'L' ? 'LONG' : ch === 'S' ? 'SHORT' : ch === '-' ? 'стороны нет' : 'нет записи'}${c ? ` · начало вызова: ${c.status}` : ''}`}
            style={{
              width: 12,
              height: 18,
              flexShrink: 0,
              borderRadius: 2,
              backgroundColor: cellBg(ch),
              border: ch === ' ' ? `1px dashed ${BORDER}` : 'none',
              color: '#0b0b0b',
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '18px',
              textAlign: 'center',
            }}
          >
            {c ? mark(c.status) : ''}
          </div>
        );
      })}
    </div>
  );
}

function CallRow({ c, onOpen, known }: { c: HistCall; onOpen?: Open; known?: boolean }) {
  const long = c.side === 'LONG';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', padding: '7px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: MONO, fontSize: 11, color: DIM, minWidth: 44 }}>{fmtWhen(c.start).slice(0, 5)}</span>
      {onOpen ? (
        <button
          onClick={() => known && onOpen(c.symbol)}
          style={{ fontFamily: MONO, fontSize: 13, color: FG, background: 'none', border: 'none', padding: 0, cursor: known ? 'pointer' : 'default', textDecoration: known ? 'underline' : 'none', textUnderlineOffset: 3 }}
        >
          {c.symbol}
        </button>
      ) : null}
      <span style={{ fontFamily: MONO, fontSize: 11, color: long ? UP : DOWN }}>{c.side}</span>
      <span style={{ ...label, letterSpacing: '0.12em' }}>{c.scenario ? `сценарий ${c.scenario}` : 'без сценария'}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', padding: '1px 7px', borderRadius: 6, color: stColor(c.status), border: `1px solid ${stColor(c.status)}55`, whiteSpace: 'nowrap' }}>
        {c.status}
      </span>
      <span style={{ color: DIM, fontSize: 12 }}>
        по направлению {num(c.fav)}, против {num(c.adv)}
        {c.end ? ` · сменилось ${dd(c.end)}` : ''}
        {c.first ? ' · стояло на начало записи' : ''}
      </span>
    </div>
  );
}

function TallyRow({ name, t }: { name: ReactNode; t: Tally }) {
  const cell = { fontFamily: MONO, fontSize: 12, textAlign: 'right' as const };
  return (
    <>
      <span style={{ color: FG, fontSize: 12 }}>{name}</span>
      <span style={{ ...cell, color: FG }}>{t.n}</span>
      <span style={{ ...cell, color: UP }}>{t.ok}</span>
      <span style={{ ...cell, color: DOWN }}>{t.bad}</span>
      <span style={{ ...cell, color: ACCENT }}>{t.open}</span>
      <span style={{ ...cell, color: FG }}>{share(t)}</span>
    </>
  );
}

function Breakdown({ title, groups }: { title: string; groups: [ReactNode, HistCall[]][] }) {
  // 25.09.2026, его скрин с iPad: заголовки «пока нет» и «верных» не влезали в карточку и обрезались —
  // заголовки короче и в одну строку, колонки не уже цифр, карточка при нехватке места прокручивается
  const head = { ...label, letterSpacing: '0.06em', textAlign: 'right' as const, whiteSpace: 'nowrap' as const };
  const shown = groups.filter(([, cs]) => cs.length);
  if (!shown.length) return null;
  return (
    <div style={{ ...card, padding: 12, overflowX: 'auto' }}>
      <div style={{ ...label, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) repeat(5, minmax(40px, auto))', gap: '6px 10px', alignItems: 'baseline' }}>
        <span />
        <span style={head}>всего</span>
        <span style={head}>по напр.</span>
        <span style={head}>против</span>
        <span style={head}>ждут</span>
        <span style={head}>верных</span>
        {shown.map(([name, cs], i) => (
          <TallyRow key={i} name={name} t={tally(cs)} />
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ ...card, padding: 16, color: DIM, fontSize: 13, lineHeight: 1.6 }}>
      История начнётся с ближайшего ночного обновления терминала: раз в сутки, после закрытия дневки, система записывает
      направление по каждому инструменту.
    </div>
  );
}

/** Вкладка «История направления»: итоги вызовов, где система ошибается, полоски по дням, список вызовов. */
export function HistoryView({ doc, order, symbols, onOpen }: { doc?: HistoryDoc; order: string[]; symbols: Set<string>; onOpen: Open }) {
  const [all, setAll] = useState(false);
  const days = (doc?.days || []).slice(-SHOW_DAYS);
  const calls = doc?.calls || [];
  if (!doc || !days.length) return <Empty />;
  const off = (doc.days || []).length - days.length;
  const rows = doc.rows || {};
  const t = tally(calls);
  const startsOf = (sym: string) => new Map(calls.filter((c) => c.symbol === sym).map((c) => [c.day, c]));
  const syms = [...order.filter((s) => rows[s] != null), ...Object.keys(rows).filter((s) => !order.includes(s))];
  const recent = [...calls].sort((a, b) => (a.start < b.start ? 1 : -1));
  const byScen: [ReactNode, HistCall[]][] = [
    ['сценарий 1', calls.filter((c) => c.scenario === '1')],
    ['сценарий 2', calls.filter((c) => c.scenario === '2')],
    ['без сценария', calls.filter((c) => !c.scenario || c.scenario === 'нет')],
  ];
  const byWeek: [ReactNode, HistCall[]][] = ['неделя за', 'неделя против', 'неделя в споре'].map((w) => [w, calls.filter((c) => weekRel(c) === w)]);
  const byConf: [ReactNode, HistCall[]][] = [
    ['подтверждение есть', calls.filter((c) => c.conf)],
    ['подтверждения нет', calls.filter((c) => !c.conf)],
  ];
  const gKeys = [...new Set(calls.map((c) => c.group || 'NONE'))];
  const byGroup: [ReactNode, HistCall[]][] = gKeys.map((g) => [GEN[g] ? `группа ${GEN[g]}` : 'без поводыря', calls.filter((c) => (c.group || 'NONE') === g)]);
  const tile = (name: string, v: ReactNode, color: string) => (
    <div style={{ ...card, padding: '10px 12px', minWidth: 110 }}>
      <div style={{ ...label, letterSpacing: '0.14em' }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 20, color, marginTop: 4 }}>{v}</div>
    </div>
  );
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ color: DIM, fontSize: 13, lineHeight: 1.6 }}>
        Запись идёт с {dd(doc.since || days[0])}.{(doc.since || days[0]).slice(0, 4)}: раз в сутки, после закрытия дневки, система записывает направление по
        каждому инструменту. Вызов — день, когда направление появилось или сменилось. Итог вызова — куда цена первой прошла 2
        средних дневных хода: по направлению или против. Задним числом история не пересчитывается.
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tile('вызовов', t.n, FG)}
        {tile('по направлению', t.ok, UP)}
        {tile('против', t.bad, DOWN)}
        {tile('пока не решила', t.open, ACCENT)}
        {tile('верных из решённых', share(t), FG)}
      </div>
      {t.ok + t.bad === 0 ? (
        <div style={{ color: DIM, fontSize: 12 }}>Решённых вызовов пока нет — обычно цене нужно от нескольких дней до пары недель.</div>
      ) : null}
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(min(420px, 100%), 1fr))' }}>
        <Breakdown title="по сценарию" groups={byScen} />
        <Breakdown title="по неделе" groups={byWeek} />
        <Breakdown title="по подтверждению" groups={byConf} />
        <Breakdown title="по группам" groups={byGroup} />
      </div>
      <div style={{ ...card, padding: 12 }}>
        <div style={{ ...label, marginBottom: 10 }}>направление по дням · последние {days.length}</div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '78px auto', gap: '3px 8px', alignItems: 'center', width: 'max-content' }}>
            <span />
            <div style={{ display: 'flex', gap: 1 }}>
              {days.map((d, i) => (
                <div key={d} style={{ width: 12, flexShrink: 0, fontFamily: MONO, fontSize: 9, color: DIM, whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {(days.length - 1 - i) % 5 === 0 ? dd(d) : ''}
                </div>
              ))}
            </div>
            {syms.map((s) => (
              <FragmentRow key={s} sym={s} days={days} line={(rows[s] || '').slice(off)} starts={startsOf(s)} onOpen={onOpen} known={symbols.has(s)} />
            ))}
          </div>
        </div>
        <div style={{ color: DIM, fontSize: 11, lineHeight: 1.7, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
          <span><span style={{ color: UP }}>■</span> LONG</span>
          <span><span style={{ color: DOWN }}>■</span> SHORT</span>
          <span><span style={{ color: '#4a443d' }}>■</span> стороны нет</span>
          <span>в клетке начала вызова: ✓ по направлению · ✗ против · • пока не решила (в таблицах — «ждут»)</span>
        </div>
      </div>
      <div style={{ ...card, padding: 12 }}>
        <div style={{ ...label, marginBottom: 4 }}>вызовы · свежие сверху</div>
        {(all ? recent : recent.slice(0, 40)).map((c) => (
          <CallRow key={`${c.symbol}-${c.start}`} c={c} onOpen={onOpen} known={symbols.has(c.symbol)} />
        ))}
        {recent.length > 40 ? (
          <button onClick={() => setAll(!all)} style={{ marginTop: 10, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer' }}>
            {all ? 'свернуть' : `показать все ${recent.length}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FragmentRow({ sym, days, line, starts, onOpen, known }: { sym: string; days: string[]; line: string; starts: Map<string, HistCall>; onOpen: Open; known: boolean }) {
  return (
    <>
      <button
        onClick={() => known && onOpen(sym)}
        style={{ fontFamily: MONO, fontSize: 11, color: FG, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: known ? 'pointer' : 'default' }}
      >
        {sym}
      </button>
      <Strip days={days} line={line} starts={starts} />
    </>
  );
}

/** Вкладка «История» у инструмента: его полоска по дням и его вызовы. */
export function HistoryOf({ doc, symbol }: { doc?: HistoryDoc; symbol: string }) {
  const days = (doc?.days || []).slice(-SHOW_DAYS);
  if (!doc || !days.length) return <Empty />;
  const off = (doc.days || []).length - days.length;
  const calls = (doc.calls || []).filter((c) => c.symbol === symbol).sort((a, b) => (a.start < b.start ? 1 : -1));
  const line = ((doc.rows || {})[symbol] || '').slice(off);
  const t = tally(calls);
  return (
    <div>
      <div style={{ color: DIM, fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
        Направление по дням с {dd(doc.since || days[0])} и вызовы системы по этому инструменту. Итог — куда цена первой прошла 2
        средних дневных хода.
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <Strip days={days} line={line} starts={new Map(calls.map((c) => [c.day, c]))} />
      </div>
      <div style={{ color: DIM, fontSize: 12, marginTop: 10 }}>
        вызовов {t.n} · по направлению <span style={{ color: UP }}>{t.ok}</span> · против <span style={{ color: DOWN }}>{t.bad}</span> · пока не решила{' '}
        <span style={{ color: ACCENT }}>{t.open}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        {calls.length ? calls.map((c) => <CallRow key={c.start} c={c} />) : <div style={{ color: DIM, fontSize: 12, paddingTop: 6 }}>Вызовов пока нет.</div>}
      </div>
    </div>
  );
}
