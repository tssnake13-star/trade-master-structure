import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, MoveRight } from 'lucide-react';
import { ACCENT, BORDER, DIM, DOWN, FG, MONO, UP, card, label } from './theme';
import { ScreenerFeed, type FeedDocs } from './Feeds';
import { parseScreener, type ScrGroup, type ScrInstrument, type ScrTop, type Side } from './screenerParse';

/**
 * Скринер в «Глазе системы» — его выбор 21.09.2026: группы блоками «вверх» и «вниз»,
 * внутри карточки; ТОП — карточками с полосками «пройдено». Текст — тот же, что
 * подписчики получили после «✅ ОДОБРЯЮ», экран его только раскладывает.
 */

type Open = (symbol: string) => void;
const col = (s: Side) => (s === 'up' ? UP : s === 'down' ? DOWN : DIM);
const arrowCh = (s: Side) => (s === 'up' ? '↑' : s === 'down' ? '↓' : '~');

const pillSide = (long: boolean): CSSProperties => ({
  fontFamily: MONO,
  fontSize: 11,
  padding: '1px 7px',
  borderRadius: 6,
  color: long ? UP : DOWN,
  border: `1px solid ${long ? UP : DOWN}55`,
  backgroundColor: long ? `${UP}14` : `${DOWN}14`,
});

function Chip({ i, symbols, onOpen }: { i: ScrInstrument; symbols: Set<string>; onOpen: Open }) {
  const long = i.side === 'LONG';
  const known = symbols.has(i.symbol);
  return (
    <button
      onClick={() => known && onOpen(i.symbol)}
      title={i.score ? `${i.score} из 3 критериев за сторону пары` : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, margin: '6px 6px 0 0', padding: '3px 8px', borderRadius: 8, border: `1px solid #2c2a27`, background: 'transparent', color: FG, cursor: known ? 'pointer' : 'default', fontSize: 12 }}
    >
      <span style={{ fontFamily: MONO }}>{i.symbol}</span>
      <span style={{ color: long ? UP : DOWN, fontFamily: MONO, fontSize: 11 }}>{long ? 'LONG' : 'SHORT'}</span>
      {i.score ? <span style={{ fontFamily: MONO, fontSize: 10, color: i.score === 3 ? ACCENT : DIM }}>{i.score}/3</span> : null}
    </button>
  );
}

function GroupCard({ g, symbols, onOpen }: { g: ScrGroup; symbols: Set<string>; onOpen: Open }) {
  const Icon = g.dir === 'up' ? TrendingUp : g.dir === 'down' ? TrendingDown : MoveRight;
  // поводырь группы — открывается его экран (у индекса доллара символ DXY)
  const leadSym = g.code === 'DXY' ? 'DXY' : g.leader;
  const leadKnown = !!leadSym && symbols.has(leadSym);
  return (
    <div style={{ ...card, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon size={16} color={col(g.dir)} />
        <span style={{ fontSize: 15, color: FG }}>{g.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>{g.code}</span>
        <span style={{ marginLeft: 'auto', ...pillSide(g.dir !== 'down'), ...(g.dir === 'flat' ? { color: DIM, borderColor: BORDER, backgroundColor: 'transparent' } : {}) }}>
          {g.trade}
        </span>
      </div>
      {g.leader ? (
        <div style={{ fontSize: 12, marginTop: 3, color: DIM }}>
          поводырь{' '}
          <button
            onClick={() => leadKnown && leadSym && onOpen(leadSym)}
            style={{ fontFamily: g.code === 'DXY' ? undefined : MONO, fontSize: 12, color: ACCENT, background: 'none', border: 'none', padding: 0, cursor: leadKnown ? 'pointer' : 'default', textDecoration: leadKnown ? 'underline' : 'none', textUnderlineOffset: 3 }}
          >
            {g.leader}
          </button>
        </div>
      ) : null}
      <div style={{ color: DIM, fontSize: 12, marginTop: 5 }}>
        неделя <span style={{ color: col(g.week.arrow) }}>{arrowCh(g.week.arrow)}</span> {g.week.text}
        {' · '}дневка <span style={{ color: col(g.day.arrow) }}>{arrowCh(g.day.arrow)}</span> {g.day.text}
        {g.macro ? (
          <span style={{ color: g.macro === 'за' ? UP : g.macro === 'против' ? DOWN : DIM }}>{` · макро ${g.macro}`}</span>
        ) : null}
      </div>
      {g.range ? (
        <div style={{ color: DIM, fontSize: 12, marginTop: 4, display: 'flex', gap: 5, alignItems: 'baseline' }}>
          <AlertTriangle size={11} color={ACCENT} style={{ flexShrink: 0, transform: 'translateY(1px)' }} />
          <span>рейндж: {g.range}</span>
        </div>
      ) : null}
      {g.acc ? (
        <details style={{ marginTop: 4, fontSize: 12, color: DIM }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
            накопления {g.code === 'DXY' ? 'индекса доллара' : g.leader || 'поводыря'}:{' '}
            <span style={{ color: g.acc.verdict === 'за' ? UP : g.acc.verdict ? ACCENT : DIM }}>
              {g.acc.verdict === 'за' ? 'в сторону группы' : g.acc.verdict === 'против' ? 'против группы' : g.acc.verdict === 'спор' ? 'неделя и дневка спорят' : 'подробно'}
            </span>{' '}
            ▾
          </summary>
          <div style={{ marginTop: 4, lineHeight: 1.55 }}>{g.acc.text}</div>
        </details>
      ) : null}
      {g.instruments.length ? <div>{g.instruments.map((i) => <Chip key={i.symbol + i.side} i={i} symbols={symbols} onOpen={onOpen} />)}</div> : null}
    </div>
  );
}

function Bar({ name, v }: { name: string; v: { passed: number | null; reserve: string | null } }) {
  if (v.passed == null) return null;
  return (
    <>
      <span style={{ color: DIM, fontSize: 12 }}>{name}</span>
      <span style={{ height: 6, background: '#211e1a', borderRadius: 3, overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${Math.min(100, v.passed)}%`, height: 6, background: ACCENT }} />
      </span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: FG, textAlign: 'right' }}>{v.passed}%</span>
    </>
  );
}

function TopCard({ t, symbols, onOpen }: { t: ScrTop; symbols: Set<string>; onOpen: Open }) {
  const long = t.side === 'LONG';
  const known = symbols.has(t.symbol);
  return (
    <div style={{ ...card, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 20, color: ACCENT }}>{t.rank}</span>
        <button onClick={() => known && onOpen(t.symbol)} style={{ fontFamily: MONO, fontSize: 15, color: FG, background: 'none', border: 'none', padding: 0, cursor: known ? 'pointer' : 'default', textDecoration: known ? 'underline' : 'none', textUnderlineOffset: 3 }}>
          {t.symbol}
        </button>
        <span style={pillSide(long)}>{t.side}</span>
        {t.scenario ? <span style={{ color: DIM, fontSize: 12, marginLeft: 'auto' }}>сценарий {t.scenario}</span> : null}
      </div>
      {t.leads ? <div style={{ color: ACCENT, fontSize: 12, marginTop: 4 }}>поводырь группы {t.leads}</div> : null}
      {t.tags.length ? <div style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{t.tags.join(' · ')}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 38px', gap: '6px 8px', alignItems: 'center', marginTop: 8 }}>
        <Bar name="неделя" v={t.week} />
        <Bar name="дневка" v={t.day} />
      </div>
      <div style={{ color: DIM, fontSize: 12, marginTop: 6 }}>
        {t.day.reserve ? `запас дневки ${t.day.reserve} ATR` : null}
        {t.agree ? <span style={{ color: UP }}>{t.day.reserve ? ' · ' : ''}цикл, критерии и накопления — в одну сторону</span> : null}
      </div>
      {t.range ? (
        <div style={{ color: DIM, fontSize: 12, marginTop: 4, display: 'flex', gap: 5, alignItems: 'baseline' }}>
          <AlertTriangle size={11} color={ACCENT} style={{ flexShrink: 0, transform: 'translateY(1px)' }} />
          <span>рейндж: {t.range}</span>
        </div>
      ) : null}
    </div>
  );
}

function Block({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', color, borderBottom: `1px solid ${color}55`, paddingBottom: 6, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>{children}</div>
    </div>
  );
}

export function ScreenerCards({ doc, symbols, onOpen }: { doc?: FeedDocs['screener']; symbols: Set<string>; onOpen: Open }) {
  const parsed = parseScreener(doc?.groups, doc?.top, doc?.leaders);
  if (!doc || (!parsed.groups.length && !parsed.top.length)) return <ScreenerFeed doc={doc} symbols={symbols} onOpen={onOpen} />;
  const up = parsed.groups.filter((g) => g.dir === 'up');
  const down = parsed.groups.filter((g) => g.dir === 'down');
  const flat = parsed.groups.filter((g) => g.dir === 'flat');
  return (
    <div>
      <div style={{ ...label, marginBottom: 14 }}>скринер от {doc.time || '—'} · одобрен автором · то же, что получили подписчики</div>
      {up.length ? (
        <Block title={`↑ ВВЕРХ · BUY · ${up.length}`} color={UP}>
          {up.map((g) => <GroupCard key={g.code} g={g} symbols={symbols} onOpen={onOpen} />)}
        </Block>
      ) : null}
      {down.length ? (
        <Block title={`↓ ВНИЗ · SELL · ${down.length}`} color={DOWN}>
          {down.map((g) => <GroupCard key={g.code} g={g} symbols={symbols} onOpen={onOpen} />)}
        </Block>
      ) : null}
      {flat.length ? (
        <Block title={`~ БЕЗ ЧЁТКОГО НАПРАВЛЕНИЯ · ${flat.length}`} color={DIM}>
          {flat.map((g) => <GroupCard key={g.code} g={g} symbols={symbols} onOpen={onOpen} />)}
        </Block>
      ) : null}
      {parsed.top.length ? (
        <Block title={`🏆 ТОП ЦИКЛОВ · ${parsed.top.length}`} color={ACCENT}>
          {parsed.top.map((t) => <TopCard key={t.rank} t={t} symbols={symbols} onOpen={onOpen} />)}
        </Block>
      ) : null}
      {parsed.fresh.length ? (
        <details style={{ ...card, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: DIM }}>
          <summary style={{ cursor: 'pointer', color: FG }}>Свежие изменения накоплений · {parsed.fresh.length} ▾</summary>
          <div style={{ marginTop: 8, lineHeight: 1.6 }}>
            {parsed.fresh.map((f, i) => (
              <div key={i}>• {f}</div>
            ))}
          </div>
        </details>
      ) : null}
      <div style={{ color: DIM, fontSize: 11, lineHeight: 1.7, display: 'flex', flexWrap: 'wrap', gap: '2px 12px', alignItems: 'center' }}>
        <span>2 из 3 — сколько из трёх критериев недели (свинг, свеча, накопления) за сторону; у пары — за её сторону</span>
        <span>макро за / против — подтверждает ли макро</span>
        <span>рейндж — цена стоит, выхода нет (информация, не запрет)</span>
      </div>
    </div>
  );
}
