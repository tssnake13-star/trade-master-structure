/**
 * Какие решения «Журнала решений» ученик уже видел (25.10.2026, идеи 7, 8 и 12 со страницы идей для кабинета).
 * Время самого свежего увиденного решения хранится в этом браузере, отдельно на каждого ученика. Первый раз ничего
 * не считается новым: запоминаем самое свежее решение, и новыми станут те, что придут после.
 */
const KEY = (uid: string) => `eg_journal_seen_${uid}`;

export const timeMs = (t: string) => new Date(t).getTime() || 0;

export function readSeen(uid?: string | null): number | null {
  if (!uid) return null;
  try {
    const v = localStorage.getItem(KEY(uid));
    return v ? Number(v) || null : null;
  } catch {
    return null;
  }
}

export function writeSeen(uid: string | null | undefined, ms: number) {
  if (!uid || !ms) return;
  try {
    if (ms > (readSeen(uid) || 0)) localStorage.setItem(KEY(uid), String(ms));
  } catch {
    /* без хранилища новых решений просто не будет видно */
  }
}

export const newestMs = (items: { time: string }[]) => items.reduce((m, v) => Math.max(m, timeMs(v.time)), 0);

export const countNew = (items: { time: string }[], seen: number | null) =>
  seen == null ? 0 : items.filter((v) => timeMs(v.time) > seen).length;

/** «1 новое решение», «2 новых решения», «5 новых решений» */
export function newDecisionsText(n: number) {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return `${n} новое решение`;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return `${n} новых решения`;
  return `${n} новых решений`;
}
