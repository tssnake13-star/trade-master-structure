import type { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import { ACCENT, BORDER, DIM, DOWN, FG, MONO, SANS, UP, label } from './theme';
import type { MarketRow } from './parts';

/**
 * Главное об инструменте — его слово 21.09.2026: «направление, сценарий, подтверждение,
 * поводырь — это самая главная информация… надо выделить и выровнять по центру… неделю
 * и дневку объединить… при 2 из 3 пояснить, какие критерии сошлись. Всё остальное —
 * пояснение». Экран ничего не считает: голоса недели и дневки присылает мост
 * (extra.w_votes / d_votes — те же функции, что дают счёт «N из 3»). Пока мост на VPS
 * старый и голосов нет, неделя и дневка показываются без разбивки.
 */

type Vote = [string, string];
type Side3 = 'LONG' | 'SHORT' | null;

const PANEL = '#191613';

const sideOf = (d: string | null | undefined): Side3 =>
  d === 'LONG' || d === 'UP' ? 'LONG' : d === 'SHORT' || d === 'DOWN' ? 'SHORT' : null;
const colorOf = (s: Side3) => (s === 'LONG' ? UP : s === 'SHORT' ? DOWN : DIM);
const arrowOf = (s: Side3) => (s === 'LONG' ? '↑' : s === 'SHORT' ? '↓' : '');

/** Название экрана — как плитка в кабинете (его слово 21.09.2026): глаз на две строки,
 *  справа TRADE MASTER INSIDE и ровно под ним «Глаз системы». */
export function Brand({ size = 40, title = 15 }: { size?: number; title?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Eye size={size} strokeWidth={1.5} color={ACCENT} style={{ flexShrink: 0, margin: `0 -${Math.round(size / 12)}px` }} />
      <div style={{ minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontFamily: SANS, fontSize: title, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', color: FG }}>
          TRADE MASTER INSIDE
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4, lineHeight: 1.3, color: DIM }}>
          Глаз системы
        </div>
      </div>
    </div>
  );
}

const cellLabel = { ...label, fontSize: 10, letterSpacing: '0.18em', color: DIM, textAlign: 'center' as const };
const bigValue = (color: string) => ({
  fontFamily: MONO,
  fontSize: 18,
  fontWeight: 700,
  lineHeight: '26px',
  color,
  marginTop: 6,
  textAlign: 'center' as const,
});
const note = { fontSize: 12, color: DIM, lineHeight: 1.45, marginTop: 4, textAlign: 'center' as const };

/** «за LONG» — зелёным, «за SHORT» — красным, как стороны везде на экране. */
function paint(t: string): ReactNode {
  return t.split(/(LONG|SHORT)/).map((p, i) =>
    p === 'LONG' || p === 'SHORT' ? (
      <span key={i} style={{ color: p === 'LONG' ? UP : DOWN }}>
        {p}
      </span>
    ) : (
      p
    ),
  );
}

/** Поводырь из строки моста: «USDJPY · за SHORT» → крупно USDJPY, под ним «за SHORT».
 *  У самого поводыря крупно «сам» — «поводырь группы …» уже стоит в шапке инструмента. */
function guideParts(r: MarketRow): { main: string; sub: string; color: string } {
  const g = (r.guide || '').trim();
  if (!g) return { main: '—', sub: '', color: DIM };
  const parts = g.split(' · ');
  if (r.extra?.leads) return { main: 'сам', sub: parts.slice(1).join(' · '), color: ACCENT };
  let main = parts[0];
  let sub = parts.slice(1).join(' · ');
  const m = main.match(/^(.*?)\s*\((.*)\)$/); // «не задан (в ТОП не идёт)»
  if (m) {
    main = m[1];
    sub = [m[2], sub].filter(Boolean).join(' · ');
  }
  return { main, sub, color: FG };
}

/** Какие критерии сошлись — словами. Дневка: реверс обязателен (его правило, чтение А,
 *  07.09.2026); неделя в споре — сторону задаёт дневка (его правило 02.09.2026). */
function critNote(tf: 'W1' | 'D1', s: Side3, votes: Vote[], anom: string | null): string {
  if (anom) {
    const d = anom.match(/(\d{2}\.\d{2})\.\d{4}/);
    return `аномальная свеча${d ? ` ${d[1]}` : ''} — неделя снята, сторону задаёт дневка`;
  }
  if (s) {
    const want = s === 'LONG' ? 'UP' : 'DOWN';
    const ok = votes.filter(([, v]) => v === want).map(([k]) => k);
    return ok.length >= 3 ? 'сошлись все три' : `сошлись ${ok.join(' и ')}`;
  }
  const up = votes.filter(([, v]) => v === 'UP').length;
  const dn = votes.filter(([, v]) => v === 'DOWN').length;
  if (tf === 'D1') {
    const rev = votes.find(([k]) => k === 'реверс')?.[1];
    if ((up >= 2 && rev !== 'UP') || (dn >= 2 && rev !== 'DOWN')) return 'реверс не согласен — без него дневка направления не даёт';
    return 'критерии не сошлись';
  }
  return up + dn ? 'критерии в споре — сторону задаёт дневка' : 'данных нет';
}

function Cell({ name, value, color, sub }: { name: string; value: string; color: string; sub?: ReactNode }) {
  return (
    <div style={{ backgroundColor: PANEL, padding: '12px 10px' }}>
      <div style={cellLabel}>{name}</div>
      <div style={bigValue(color)}>{value}</div>
      {sub ? <div style={note}>{sub}</div> : null}
    </div>
  );
}

function Crit({ tf, r }: { tf: 'W1' | 'D1'; r: MarketRow }) {
  const dir = tf === 'W1' ? r.w_dir : r.d_dir;
  const n = tf === 'W1' ? r.w_n : r.d_n;
  const votes = ((tf === 'W1' ? r.extra?.w_votes : r.extra?.d_votes) || []) as Vote[];
  const anom = tf === 'W1' ? r.extra?.w_anom || null : null;
  const s = anom ? null : sideOf(dir);
  const value = anom
    ? 'снята'
    : s
      ? `${s} ${arrowOf(s)} · ${n ?? '—'} из 3`
      : tf === 'W1'
        ? dir === 'MIXED'
          ? 'спор'
          : 'нет'
        : 'нет направления';
  return (
    <div style={{ backgroundColor: PANEL, padding: '12px 10px' }}>
      <div style={cellLabel}>{tf === 'W1' ? 'неделя' : 'дневка'}</div>
      <div style={bigValue(s ? colorOf(s) : ACCENT)}>{value}</div>
      {votes.length ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 14px', marginTop: 6, fontFamily: MONO, fontSize: 12 }}>
            {votes.map(([k, v]) => {
              const vs = sideOf(v);
              return (
                <span key={k} style={{ color: vs ? colorOf(vs) : DIM, whiteSpace: 'nowrap' }}>
                  {k} {vs ? arrowOf(vs) : '—'}
                </span>
              );
            })}
          </div>
          <div style={note}>{critNote(tf, s, votes, anom)}</div>
        </>
      ) : null}
    </div>
  );
}

/** Блок главного: направление · сценарий · подтверждение · поводырь, под ними неделя и дневка. */
export function Decision({ r, narrow }: { r: MarketRow; narrow: boolean }) {
  const s = sideOf(r.side);
  const g = guideParts(r);
  return (
    <div style={{ marginTop: 14, border: `1px solid ${ACCENT}33`, borderRadius: 12, overflow: 'hidden', backgroundColor: BORDER, display: 'grid', gap: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 1 }}>
        <Cell name="направление" value={s ? `${s} ${arrowOf(s)}` : '—'} color={colorOf(s)} />
        {/* «идём по недельному циклу» — его слово 21.09.2026: строку с живого графика —
            сюда, наверх; слова те же, что на картинке бота */}
        <Cell
          name="сценарий"
          value={r.scenario ? `${r.scenario} — ${r.side === 'LONG' ? 'вверх' : 'вниз'}` : 'нет'}
          color={r.scenario ? FG : DIM}
          sub={
            r.scenario === '1'
              ? 'идём по недельному циклу'
              : r.scenario === '2'
                ? 'недельный цикл пройден, идём против него'
                : null
          }
        />
        <Cell name="подтверждение" value={r.confirmation ? 'ЕСТЬ' : 'нет'} color={r.confirmation ? UP : DIM} />
        <Cell name="поводырь" value={g.main} color={g.color} sub={g.sub ? paint(g.sub) : null} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 1 }}>
        <Crit tf="W1" r={r} />
        <Crit tf="D1" r={r} />
      </div>
    </div>
  );
}
