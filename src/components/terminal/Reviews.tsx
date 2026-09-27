import type { RefObject } from 'react';
import YouTubePlayer from '@/components/school/YouTubePlayer';
import { weekLabel, youTubeId, type JournalVideo } from '@/lib/journalVideos';
import { ACCENT, BORDER, DIM, FG, MONO, card, label } from './theme';

/**
 * Видеоразборы в «Журнале решений Сергея» — его слово 25.09.2026: серия «Допуск-отказ» рядом с решениями,
 * «прямое доказательство». Сверху — плеер с выбранной серией (по умолчанию свежая) и список всех серий;
 * над карточками каждой недели — кнопка «разбор этой недели», она включает серию в этом плеере.
 */
export function VideoReviews({
  videos,
  currentId,
  onPick,
  boxRef,
}: {
  videos: JournalVideo[];
  currentId: string | null;
  onPick: (id: string) => void;
  boxRef: RefObject<HTMLDivElement>;
}) {
  const cur = videos.find((v) => v.id === currentId) || videos[0];
  if (!cur) return null;
  const yt = youTubeId(cur.url);
  return (
    <div ref={boxRef} style={{ ...card, padding: 12, marginBottom: 14, scrollMarginTop: 12 }}>
      <div style={{ ...label, color: ACCENT, marginBottom: 4 }}>видеоразбор недели · сериал «Допуск-отказ»</div>
      <div style={{ color: DIM, fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
        Каждую неделю Сергей разбирает свои допуски и отказы: почему решил и что случилось после решения.
      </div>
      {yt ? (
        <div style={{ maxWidth: 720 }}>
          <YouTubePlayer key={cur.id} url={cur.url} />
        </div>
      ) : (
        <a
          href={cur.url}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-block', fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '7px 11px', textDecoration: 'none' }}
        >
          ▶ смотреть серию ↗
        </a>
      )}
      <div style={{ marginTop: 8, color: FG, fontSize: 13 }}>
        {cur.title} <span style={{ color: DIM }}>· разбирает неделю {weekLabel(cur.week)}</span>
      </div>
      {videos.length > 1 ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', color: DIM, fontSize: 12 }}>все серии · {videos.length} ▾</summary>
          <div style={{ marginTop: 6, display: 'grid', gap: 2 }}>
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => onPick(v.id)}
                style={{ textAlign: 'left', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', color: v.id === cur.id ? ACCENT : FG, fontSize: 12 }}
              >
                ▶ {v.title} <span style={{ color: DIM }}>· неделя {weekLabel(v.week)}</span>
              </button>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

// «серия 10» из названия «Серия 10 · …» — на кнопке недели полное название длинное
const epNo = (t: string) => (t.match(/сери[яи]\s*№?\s*\d+/i) || [''])[0].toLowerCase();

/** Заголовок недели в ленте карточек; есть серия про эту неделю — кнопка, которая включает её сверху. */
export function WeekHeader({ monday, video, onPlay }: { monday: string; video?: JournalVideo; onPlay: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', margin: '8px 2px 0' }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT }}>
        неделя {weekLabel(monday)}
      </span>
      {video ? (
        <button
          onClick={onPlay}
          style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: FG, background: 'none', border: `1px solid ${ACCENT}66`, borderRadius: 7, padding: '4px 9px', cursor: 'pointer' }}
        >
          ▶ разбор этой недели{epNo(video.title) ? ` · ${epNo(video.title)}` : ''}
        </button>
      ) : null}
    </div>
  );
}
