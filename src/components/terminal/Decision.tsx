import type { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import { ACCENT, BORDER, DIM, DOWN, FG, MONO, SANS, UP, label } from './theme';
import { type MarketRow } from './parts';
import { GEN } from './screenerParse';

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
 *  справа ECHO-GATE INSIDE и ровно под ним «Глаз системы». */
export function Brand({ size = 40, title = 15 }: { size?: number; title?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Eye size={size} strokeWidth={1.5} color={ACCENT} style={{ flexShrink: 0, margin: `0 -${Math.round(size / 12)}px` }} />
      <div style={{ minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontFamily: SANS, fontSize: title, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', color: FG }}>
          ECHO-GATE INSIDE
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 4, lineHeight: 1.3, color: DIM }}>
          Глаз системы
        </div>
      </div>
    </div>
  );
}

/** Стиль торговли — над кнопками разделов (его слово 30.09.2026: «чуть-чуть покрупнее,
 *  чтобы было заметно… над кнопками инструмент, скринер, топ, тренд»). Сначала строка
 *  стояла третьей под названием у глаза, и глаз в шапке съехал — оттуда убрана. */
export function TradingStyle() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: DIM }}>
        Стиль торговли
      </span>
      <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, lineHeight: 1.1, color: ACCENT }}>
        Swing Trading
      </span>
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

/** Поддерживает ли поводырь сделку по направлению карточки — 03.10.2026, его слово: «по выражению
 *  „индекс доллара за LONG“ не сразу понятно… должно быть сразу понятно, поводырь поддерживает
 *  направление или он против». «за X» в строке моста — сторона, которую поводырь даёт этой паре;
 *  сравниваем с направлением карточки. Направления у карточки нет — остаётся «за X». */
function stanceOf(g: string, side: Side3): ReactNode {
  const lead = sideOf((g.match(/за (LONG|SHORT)/) || [])[1]);
  if (!lead) return /без направления/.test(g) ? 'без направления' : null;
  if (!side) return <>за {paint(lead)}</>;
  return lead === side ? (
    <span style={{ color: UP, fontWeight: 600 }}>✅ поддерживает {side}</span>
  ) : (
    <span style={{ color: DOWN, fontWeight: 600 }}>⛔ против {side}</span>
  );
}

/** Поводырь из строки моста: «USDJPY · за SHORT» → крупно USDJPY, под ним — поддерживает ли он сделку.
 *  03.10.2026, его слово: у самого поводыря вместо «сам» — «главный в группе доллара», у поводырей
 *  групп — «главный в группе йены» и под ним его собственный поводырь (индекс доллара) с той же
 *  строкой «поддерживает / против»; у биткоина доллара нет — сторону ему даёт своя группа.
 *  (ALPHA у индекса доллара убрана 24.09.2026, «сам» — 03.10.2026.) */
function guideParts(r: MarketRow): { main: string; sub: ReactNode; color: string } {
  const g = (r.guide || '').trim();
  if (!g) return { main: '—', sub: null, color: DIM };
  const side = sideOf(r.side);
  const parts = g.split(' · ');
  const leads = r.extra?.leads;
  if (leads) {
    const main = `главный в группе ${GEN[leads] || leads}`;
    const rest = parts.slice(1).join(' · ');
    // ⛔ 08.10.2026, его слово: «сторону даёт своя группа без направления — непонятно… как индекс доллара — главный
    // в группе доллара… этот комментарий удалить». У поводыря без своего поводыря (S&P 500, биткоин) — только «главный в группе»
    if (leads === 'DXY' || !/индекс доллара/.test(rest)) return { main, sub: null, color: ACCENT };
    const st = stanceOf(rest, side);
    return { main, sub: <>его поводырь — индекс доллара{st ? <><br />{st}</> : null}</>, color: ACCENT };
  }
  let main = parts[0];
  let rest = parts.slice(1).join(' · ');
  const m = main.match(/^(.*?)\s*\((.*)\)$/); // «не задан (в ТОП не идёт)»
  if (m) {
    main = m[1];
    rest = [m[2], rest].filter(Boolean).join(' · ');
  }
  const st = stanceOf(rest, side);
  // у нефти «контекст группы нефти за LONG» — слова про группу остаются над строкой «поддерживает»
  const head = rest
    .replace(/\s*за (LONG|SHORT)\b/, '')
    .replace(/\s*без направления/, '')
    .trim()
    .replace(/^\((.*)\)$/, '$1');
  const sub = st && head ? <>{head}<br />{st}</> : st || (head ? paint(head) : null);
  return { main, sub, color: FG };
}

/** Какие критерии сошлись — словами. Неделя и дневка считаются одинаково: свинг, свеча,
 *  накопления, чистое 2 из 3 (его определение 21.09.2026 вечер — реверс только в
 *  подтверждении); неделя в споре — сторону задаёт дневка (его правило 02.09.2026). */
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
  if (!up && !dn) return 'данных нет';
  return tf === 'W1' ? 'критерии в споре — сторону задаёт дневка' : 'критерии в споре — направления нет';
}

/** Голоса одной строкой: «свинг ↑  свеча ↑  реверс ↓», каждый своим цветом. */
function VoteChips({ votes }: { votes: Vote[] }) {
  return (
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
  );
}

/** Мост до 21.09.2026 (вечер) слал в d_votes подтверждение (свинг, свеча, реверс) под именем
 *  дневки. Пока на VPS старый мост, эти голоса показываем в подтверждении, а у дневки — без разбивки. */
const legacyD1 = (r: MarketRow) => (r.extra?.d_votes || []).some(([k]) => k === 'реверс');

function Cell({ name, value, color, sub, small }: { name: ReactNode; value: string; color: string; sub?: ReactNode; small?: boolean }) {
  // small — длинное значение («главный в группе новозеландца»): шрифт меньше, чтобы влезало в половину блока
  return (
    <div style={{ backgroundColor: PANEL, padding: '12px 10px' }}>
      <div style={cellLabel}>{name}</div>
      <div style={small ? { ...bigValue(color), fontSize: 14, lineHeight: '20px' } : bigValue(color)}>{value}</div>
      {sub ? <div style={note}>{sub}</div> : null}
    </div>
  );
}

/** 22.09.2026, его слово: «посередине прям потолще линию, чтобы разделять два таймфрейма…
 *  сверху крупными буквами — неделя и дневка… лучше по-русски». Слева неделя: направление,
 *  сценарий, критерии и поводырь; справа дневка: направление, подтверждение, запас хода (15.10.2026) и итог (18.10.2026). */
const TF_HEAD = {
  fontFamily: SANS,
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: ACCENT,
  textAlign: 'center' as const,
  padding: '10px 8px 9px',
  backgroundColor: PANEL,
};
const DIVIDER = `${ACCENT}99`;

function Half({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, backgroundColor: BORDER, minWidth: 0 }}>
      <div style={TF_HEAD}>{title}</div>
      {children}
    </div>
  );
}

function Crit({ tf, r, name = 'критерии' }: { tf: 'W1' | 'D1'; r: MarketRow; name?: string }) {
  const dir = tf === 'W1' ? r.w_dir : r.d_dir;
  const n = tf === 'W1' ? r.w_n : r.d_n;
  const votes = ((tf === 'W1' ? r.extra?.w_votes : legacyD1(r) ? [] : r.extra?.d_votes) || []) as Vote[];
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
    // 22.09.2026: неделя и дневка теперь заголовками половин — здесь только «критерии»;
    // клетка тянется до низа половины, чтобы половины кончались ровно.
    // 15.10.2026, его слово: у дневки та же клетка называется «направление»
    <div style={{ backgroundColor: PANEL, padding: '12px 10px', flex: 1 }}>
      <div style={cellLabel}>{name}</div>
      <div style={bigValue(s ? colorOf(s) : ACCENT)}>{value}</div>
      {votes.length ? (
        <>
          <VoteChips votes={votes} />
          <div style={note}>{critNote(tf, s, votes, anom)}</div>
        </>
      ) : null}
    </div>
  );
}

/** Запас хода — 15.10.2026, его правило перехая / перелоя: «когда цена доходит до этой точки, заходить уже
 *  поздно… бинарно, допуск отказ». Экран ничего не считает: мост присылает extra.zapas — тот же фильтр, что
 *  держит допуск бота (сначала поводырь группы). Под словами — у кого смотрели и даты, без цен.
 *  15.10.2026, его слова: «нет — перехай» многим непонятно — «входить нельзя… хай переписан», вниз — «лоу
 *  переписан»; «раз пишем входить нельзя — нужно писать входить можно, а не просто есть».
 *  18.10.2026, его слово: «запас хода… давай вернем, пускай будет так же, как в подтверждении… есть или нет» —
 *  «входить можно / нельзя» переехало в клетку «итог». */
function Zapas({ r }: { r: MarketRow }) {
  const z = r.extra?.zapas;
  const down = z?.word === 'перелой'; // сделка вниз: точка — лоу начала движения вверх
  const who = z?.lead && z.who ? <>у поводыря — {z.who}<br /></> : null;
  let value = '—';
  let color = DIM;
  let sub: ReactNode = null;
  // 16.10.2026, его слово «внедряй везде»: у поводыря запаса нет — смотрели индекс доллара над ним, хватает одного
  const t = z?.top;
  const tDown = t?.side === 'SHORT';
  const mine = z ? <>{who}{down ? 'лоу' : 'хай'} {z.a} переписан{z.touch ? ` ${z.touch}` : ''}</> : null;
  if (z && t) {
    value = z.ok ? 'ЕСТЬ' : 'нет';
    color = z.ok ? UP : DIM;
    const dxy = t.ok
      ? (t.none ? 'большого отката не было' : <>запас до {tDown ? 'лоу' : 'хая'} {t.a}</>)
      : <>{tDown ? 'лоу' : 'хай'} {t.a} переписан{t.touch ? ` ${t.touch}` : ''}</>;
    sub = <>{mine}<br />у индекса доллара — {dxy}</>;
  } else if (z && z.ok) {
    value = 'ЕСТЬ';
    color = UP;
    sub = z.none ? <>{who}большого отката не было</> : <>{who}запас до {down ? 'лоу' : 'хая'} {z.a}</>;
  } else if (z) {
    value = 'нет';
    color = DIM;
    sub = <>{who}{down ? 'лоу' : 'хай'} {z.a} переписан{z.touch ? ` ${z.touch}` : ''}</>;
  } else if (!sideOf(r.side)) {
    sub = 'у инструмента нет направления';
  }
  return (
    <div style={{ backgroundColor: PANEL, padding: '12px 10px', flex: 1 }}>
      <div style={cellLabel}>запас хода</div>
      <div style={bigValue(color)}>{value}</div>
      {sub ? <div style={note}>{sub}</div> : null}
    </div>
  );
}

/** Итог — 18.10.2026, его слово: «в дневке не хватает четвёртого наименования, то есть итог. По инструменту
 *  входить можно или нельзя. И почему нельзя, если нельзя». Экран ничего не считает: мост присылает extra.itog —
 *  те же проверки, что держат допуск бота, для стороны карточки; причины — словами клеток карточки.
 *  Тест накопления H4 и средняя 100 смотрят свечи триггера, поэтому у «можно» строка про H4. */
function Itog({ r }: { r: MarketRow }) {
  const it = r.extra?.itog;
  const why = it?.why || [];
  // 18.10.2026, его слово: «итог вообще инструмента нужно выделить границы, чтобы он прям выделялся» — рамка цвета итога
  const c = it ? (it.ok ? UP : DOWN) : null;
  return (
    <div
      style={{
        backgroundColor: c ? `${c}14` : PANEL,
        padding: '12px 10px',
        flex: 1,
        boxShadow: c ? `inset 0 0 0 2px ${c}` : undefined,
      }}
    >
      <div style={cellLabel}>итог</div>
      <div style={bigValue(it ? (it.ok ? UP : DOWN) : DIM)}>{it ? (it.ok ? 'входить можно' : 'входить нельзя') : '—'}</div>
      {it ? (
        <div style={note}>
          {it.ok
            ? 'точку входа ждём на H4' // 18.10.2026, его слово: «точку входа не ищем, а ждём на H4»
            : why.map((w, i) => (
                <span key={w}>
                  {i ? <br /> : null}
                  {w}
                </span>
              ))}
        </div>
      ) : null}
    </div>
  );
}

/** Блок главного: слева НЕДЕЛЯ, справа ДНЕВКА, между ними толстая линия (22.09.2026).
 *  15.10.2026, его слово: «на неделе шаг 1 должны быть направление, сценарий, критерии, поводырь; на дневке
 *  три — направление, подтверждение и запас хода». Поводырь переехал на неделю, у дневки клетка критериев
 *  называется «направление», новая клетка — «запас хода».
 *  18.10.2026: у дневки четвёртая клетка — «итог» (входить можно / нельзя и почему), запас хода — «есть / нет».
 *  На узком экране половины идут друг под другом, линия — поперёк. */
export function Decision({ r, narrow }: { r: MarketRow; narrow: boolean }) {
  const s = sideOf(r.side);
  const g = guideParts(r);
  const confVotes = ((legacyD1(r) ? r.extra?.d_votes : r.extra?.c_votes) || []) as Vote[];
  const pair = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 } as const;
  return (
    <div
      style={{
        marginTop: 14,
        border: `1px solid ${ACCENT}33`,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: BORDER,
        display: 'grid',
        gridTemplateColumns: narrow ? '1fr' : '1fr 4px 1fr',
      }}
    >
      {/* 23.09.2026, его слово: «неделя тире шаг 1… дневка тире шаг 2» — шаги алгоритма */}
      <Half title="неделя — шаг 1">
        <div style={pair}>
          <Cell name="направление" value={s ? `${s} ${arrowOf(s)}` : '—'} color={colorOf(s)} />
          {/* «идём по недельному циклу» — его слово 21.09.2026: строку с живого графика —
              сюда, наверх; слова те же, что на картинке бота */}
          {/* ⛔ 21.10.2026, его слово: сценарий по контексту убран везде — здесь только сценарии 1 и 2 (строка с прежним
              кодом «итог», пока бот на VPS не обновлён, читается как «нет») */}
          <Cell
            name="сценарий"
            value={r.scenario === '1' || r.scenario === '2' ? `${r.scenario} — ${r.side === 'LONG' ? 'вверх' : 'вниз'}` : 'нет'}
            color={r.scenario === '1' || r.scenario === '2' ? FG : DIM}
            sub={r.scenario === '1' ? 'идём по недельному циклу' : r.scenario === '2' ? 'недельный цикл пройден, идём против него' : null}
          />
        </div>
        {/* 15.10.2026: второй ряд недели — критерии и поводырь; ряд тянется до низа половины */}
        <div style={{ ...pair, flex: 1 }}>
          <Crit tf="W1" r={r} />
          {/* 24.09.2026, его слово: ALPHA убрана — у индекса доллара и у пар, которые он ведёт, просто «поводырь» */}
          <Cell
            name="поводырь"
            value={g.main}
            color={g.color}
            sub={g.sub}
            small={g.main.length > 14}
          />
        </div>
      </Half>
      {/* 22.09.2026: толстая линия между неделей и дневкой */}
      <div style={{ backgroundColor: DIVIDER, ...(narrow ? { height: 4 } : { width: 4 }) }} />
      <Half title="дневка — шаг 2">
        <div style={pair}>
          {/* 15.10.2026, его слово: у дневки — «направление» (свинг, свеча, накопления, 2 из 3) */}
          <Crit tf="D1" r={r} name="направление" />
          {/* 21.09.2026 вечер, его определение: подтверждение — только на дневке: свинг, свеча,
              реверс; реверс обязателен. «Если его нет, сделку нельзя делать» */}
          <Cell
            name="подтверждение"
            value={r.confirmation ? 'ЕСТЬ' : 'нет'}
            color={r.confirmation ? UP : DIM}
            sub={
              confVotes.length ? (
                <>
                  <VoteChips votes={confVotes} />
                  {r.confirmation ? null : <div style={{ marginTop: 4 }}>нужен реверс в сторону сделки и с ним свинг или свеча</div>}
                </>
              ) : null
            }
          />
        </div>
        {/* 18.10.2026: второй ряд дневки — запас хода и итог; ряд тянется до низа половины */}
        <div style={{ ...pair, flex: 1 }}>
          <Zapas r={r} />
          <Itog r={r} />
        </div>
      </Half>
    </div>
  );
}
