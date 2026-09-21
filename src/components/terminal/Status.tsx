import { ACCENT, DIM, DOWN, MONO, UP, fmtWhen, fromBotTime } from './theme';
import type { FeedDocs } from './Feeds';

/**
 * Строка свежести данных — 21.09.2026, его «да» на совет: ученик должен видеть, насколько
 * свежая картина. Данные VPS шлёт сам раз в час, поэтому «онлайн» — обновление не старше
 * 75 минут; до трёх часов — «обновление задерживается»; дольше — сколько часов его нет.
 */
export default function StatusStrip({ updatedAt, feeds, now }: { updatedAt: string | null; feeds: FeedDocs; now: number }) {
  const upd = updatedAt ? new Date(updatedAt).getTime() : NaN;
  const age = Number.isNaN(upd) ? null : (now - upd) / 60000;
  const [word, color] =
    age == null
      ? ['данных нет', DOWN]
      : age <= 75
        ? ['онлайн', UP]
        : age <= 180
          ? ['обновление задерживается', ACCENT]
          : [`нет обновлений ${Math.floor(age / 60)} ч`, DOWN];
  const screener = fromBotTime(feeds.screener?.time);
  const lastVerdict = (feeds.verdicts?.items || [])
    .map((v) => v.time)
    .filter(Boolean)
    .sort()
    .pop();
  const item = { whiteSpace: 'nowrap' as const };
  return (
    <div
      title="Данные с сервера бота обновляются сами раз в час. Все времена — по вашему часовому поясу."
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 14px', fontFamily: MONO, fontSize: 11, color: DIM }}
    >
      <span style={{ ...item, display: 'inline-flex', alignItems: 'center', gap: 6, color }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
        {word}
      </span>
      <span style={item}>данные {fmtWhen(updatedAt)}</span>
      {screener ? <span style={item}>скринер {fmtWhen(screener)}</span> : null}
      {lastVerdict ? <span style={item}>последнее решение {fmtWhen(lastVerdict)}</span> : null}
    </div>
  );
}
