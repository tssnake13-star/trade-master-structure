/**
 * Проба терминала на компьютере (30.10.2026, его «да, делай»): школьный бот даёт личную ссылку
 * /school/full?t=<tg_id>.<exp>.<подпись>. Пока человек регистрируется, подтверждает почту или входит, ссылка ждёт
 * в этом браузере; потом кабинет сам открывает пробу (функция базы claim_web_trial — она же проверяет подпись).
 */
const KEY = 'tlt_web_trial';

export function saveWebTrial(t: string) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* браузер без хранилища — ссылка сработает, только если вход уже выполнен */
  }
}

export function pendingWebTrial(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearWebTrial() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* нечего чистить */
  }
}

/** 30.10.2026: только что зарегистрировался — следующий шаг «Подключите Telegram» (/school/telegram), и после подтверждения почты тоже */
const LINK_KEY = 'tlt_link_tg';

export function markLinkPending() {
  try {
    localStorage.setItem(LINK_KEY, '1');
  } catch {
    /* без хранилища кнопка есть в кабинете */
  }
}

export function linkPending(): boolean {
  try {
    return localStorage.getItem(LINK_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearLinkPending() {
  try {
    localStorage.removeItem(LINK_KEY);
  } catch {
    /* нечего чистить */
  }
}

/** конец пробы из ссылки — для подписи «до …» до входа (подпись проверяет база, здесь только дата) */
export function webTrialUntil(t: string | null): Date | null {
  const exp = Number((t || '').split('.')[1]);
  return Number.isFinite(exp) && exp > 0 ? new Date(exp * 1000) : null;
}

/** «5 ноября» по Астане */
export function fmtTrialDate(d: Date): string {
  const a = new Date(d.getTime() + 5 * 3600e3);
  const mo = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${a.getUTCDate()} ${mo[a.getUTCMonth()]}`;
}
