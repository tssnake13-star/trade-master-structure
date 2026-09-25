/**
 * Видео сериала «Допуск-отказ» в «Журнале решений Сергея» — его слово 25.09.2026: «разместить видео в журнале
 * решений, чтобы было сразу понятно, что это разбор именно допусков… каждую неделю… это же прямое доказательство…
 * чтобы я мог это делать сам через админ-панель, как размещаю видеоуроки».
 *
 * Список лежит в site_settings (ключ terminal_journal_videos) одной строкой JSON: добавляет и убирает админ
 * в «Админ-панели → Разборы допусков», терминал только читает. Неделя — понедельник той недели, которую
 * разбирает серия (серия выходит на выходных и разбирает допуски прошедшей недели).
 */
export const JOURNAL_VIDEOS_KEY = 'terminal_journal_videos';

export interface JournalVideo {
  id: string;
  title: string;
  url: string;
  week: string; // ГГГГ-ММ-ДД — понедельник разобранной недели
  added?: string;
}

export function parseJournalVideos(raw: string | null | undefined): JournalVideo[] {
  try {
    const a = JSON.parse(raw || '[]');
    if (!Array.isArray(a)) return [];
    return a
      .filter((v) => v && typeof v.url === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(String(v.week)))
      .map((v) => ({ id: String(v.id || v.url), title: String(v.title || ''), url: String(v.url), week: String(v.week), added: v.added }))
      .sort((x, y) => (x.week < y.week ? 1 : x.week > y.week ? -1 : 0));
  } catch {
    return [];
  }
}

/** Код видео YouTube из любой ссылки (watch, youtu.be, shorts, live, embed) — как в плеере уроков. */
export function youTubeId(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com') {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(?:live|embed|shorts)\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {
    /* не ссылка */
  }
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Понедельник недели для даты (по календарю зрителя). */
export function mondayOf(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return iso(x);
}

/** Понедельник недели сигнала — по его времени (UTC+5), как считает бот и субботняя сводка. */
export function mondayOfSignal(timeIso: string): string {
  const d = new Date(new Date(timeIso).getTime() + 5 * 3600e3);
  const wd = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd)).toISOString().slice(0, 10);
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** «14–18 сентября» или «31 августа – 4 сентября»: понедельник — пятница. */
export function weekLabel(monday: string): string {
  const [y, m, d] = monday.split('-').map(Number);
  const a = new Date(y, m - 1, d);
  const b = new Date(y, m - 1, d + 4);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}

/** Название следующей серии: «Серия N+1» по самому большому номеру в списке (дальше он дописывает название). */
export function nextTitle(list: JournalVideo[]): string {
  const n = Math.max(0, ...list.map((v) => Number((v.title.match(/сери[яи]\s*№?\s*(\d+)/i) || [])[1] || 0)));
  return `Серия ${n + 1} · `;
}
