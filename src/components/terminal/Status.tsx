import { ACCENT, DIM, DOWN, MONO, UP, fmtWhen, fromBotTime } from './theme';
import type { FeedDocs } from './Feeds';

/**
 * Строка свежести данных — 21.09.2026, его «да» на совет: ученик должен видеть, насколько
 * свежая картина.
 *
 * График обновления (его решение 22.09.2026: «сделай всё-таки обновление каждый час»): VPS
 * шлёт данные сам каждый час, в 5 минут каждого часа; ручное обновление график не сдвигает.
 * 21.09 было «каждые 4 часа в 00, 04, 08…», но часы VPS — UTC+3, а у него UTC+5, и задача
 * шла в 02, 06, 10… по его времени — сторож поднимал тревогу, которой не было. Отметка
 * в минутах часа от пояса не зависит (разница целая, в часах).
 * Его вопрос: «как понять, что обновление идёт по графику без задержек?» — экран сам сверяет
 * время последних данных с последней отметкой графика:
 *   • данные не старше ожидаемой отметки — «по графику»;
 *   • пропущена одна отметка — «задерживается» и во сколько ждали;
 *   • пропущено больше — «нет обновлений N ч».
 * Круг обновления идёт около 5 минут, поэтому первые 15 минут после отметки ждём ещё
 * предыдущую.
 */
const SLOT_MS = 3600e3; // каждый час
const SLOT_AT_MS = 5 * 60e3; // в 5 минут каждого часа
const RUN_MS = 15 * 60e3; // сколько после отметки даём кругу закончиться

function lastSlot(now: number) {
  return Math.floor((now - SLOT_AT_MS) / SLOT_MS) * SLOT_MS + SLOT_AT_MS;
}

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function StatusStrip({ updatedAt, feeds, now }: { updatedAt: string | null; feeds: FeedDocs; now: number }) {
  const upd = updatedAt ? new Date(updatedAt).getTime() : NaN;
  const last = lastSlot(now);
  // первые 15 минут после отметки круг ещё может идти — тогда ждём предыдущую
  const expected = now - last < RUN_MS ? last - SLOT_MS : last;
  const next = last + SLOT_MS;
  let word: string;
  let color: string;
  if (Number.isNaN(upd)) {
    [word, color] = ['данных нет', DOWN];
  } else if (upd >= expected - 60e3) {
    [word, color] = ['по графику', UP];
  } else if (upd >= expected - SLOT_MS - 60e3) {
    [word, color] = [`задерживается — ждали в ${hhmm(expected)}`, ACCENT];
  } else {
    [word, color] = [`нет обновлений ${Math.floor((now - upd) / 3600e3)} ч`, DOWN];
  }
  const screener = feeds.screener?.at || fromBotTime(feeds.screener?.time);
  const lastVerdict = (feeds.verdicts?.items || [])
    .map((v) => v.time)
    .filter(Boolean)
    .sort()
    .pop();
  const item = { whiteSpace: 'nowrap' as const };
  return (
    <div
      title="Данные с сервера бота обновляются сами каждый час, в 5 минут каждого часа. Все времена здесь — по вашему часовому поясу."
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 14px', fontFamily: MONO, fontSize: 11, color: DIM }}
    >
      <span style={{ ...item, display: 'inline-flex', alignItems: 'center', gap: 6, color }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
        {word}
      </span>
      <span style={item}>данные {fmtWhen(updatedAt)}</span>
      <span style={item}>следующее {hhmm(next)}</span>
      {screener ? <span style={item}>скринер {fmtWhen(screener)}</span> : null}
      {lastVerdict ? <span style={item}>последнее решение {fmtWhen(lastVerdict)}</span> : null}
    </div>
  );
}
