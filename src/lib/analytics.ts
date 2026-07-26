import { supabase } from '@/integrations/supabase/client';

/**
 * Своя веб-аналитика. Пишем ровно три вида событий:
 *   pageview — заход на страницу
 *   scroll   — посетитель докрутил до ключевого блока (видно, где отваливаются)
 *   click    — нажатие на CTA (бот, разбор, личка, цены)
 *
 * Приватность: ни IP, ни cookie, ни user-agent. session_id живёт в
 * sessionStorage — то есть одну сессию браузера, связать с человеком нельзя.
 * Поэтому персональных данных не собираем и баннер согласия не нужен.
 *
 * Все вызовы «тихие»: если запрос не прошёл (офлайн, блокировщик, спящая база),
 * сайт продолжает работать как будто аналитики нет.
 */

const SESSION_KEY = 'tlt_sid';
const SENT_ONCE = new Set<string>();

const isBrowser = typeof window !== 'undefined';

function sessionId(): string {
  if (!isBrowser) return '';
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'nostorage';
  }
}

/** Откуда пришёл посетитель: utm_source, иначе домен referrer, иначе direct. */
function detectSource(): string {
  if (!isBrowser) return 'direct';
  try {
    const utm = new URLSearchParams(window.location.search).get('utm_source');
    if (utm) return utm.toLowerCase().slice(0, 64);

    const ref = document.referrer;
    if (!ref) return 'direct';
    const host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase();
    if (host === window.location.hostname.replace(/^www\./, '')) return 'internal';

    // сводим известные площадки к коротким именам, остальное — как домен
    const map: [RegExp, string][] = [
      [/instagram|ig\.me/, 'instagram'],
      [/(^|\.)t\.me$|telegram/, 'telegram'],
      [/youtube|youtu\.be/, 'youtube'],
      [/google\./, 'google'],
      [/yandex\.|ya\.ru/, 'yandex'],
      [/dzen\.ru|zen\.yandex/, 'dzen'],
      [/facebook|fb\.com/, 'facebook'],
      [/tiktok/, 'tiktok'],
    ];
    for (const [re, name] of map) if (re.test(host)) return name;
    return host.slice(0, 64);
  } catch {
    return 'direct';
  }
}

function device(): 'mobile' | 'desktop' {
  if (!isBrowser) return 'desktop';
  return window.innerWidth < 900 ? 'mobile' : 'desktop';
}

/** Свои визиты в статистику не пишем — иначе она врёт. */
function isOwnVisit(): boolean {
  if (!isBrowser) return false;
  try {
    // админ помечается при входе в кабинет (см. AdminVisitFlag ниже)
    if (localStorage.getItem('tlt_is_admin') === '1') return true;
    return /localhost|127\.0\.0\.1/.test(window.location.hostname);
  } catch {
    return false;
  }
}

async function send(event_type: 'pageview' | 'scroll' | 'click', path: string, target?: string) {
  if (!isBrowser || isOwnVisit()) return;
  try {
    await supabase.rpc('track_event', {
      _session_id: sessionId(),
      _event_type: event_type,
      _path: path.slice(0, 255),
      _target: target ?? null,
      _referrer: document.referrer ? new URL(document.referrer).hostname.slice(0, 255) : null,
      _source: detectSource(),
      _device: device(),
    });
  } catch {
    /* аналитика никогда не должна ломать страницу */
  }
}

/** Заход на страницу. */
export function trackPageview(path = isBrowser ? window.location.pathname : '/') {
  void send('pageview', path);
}

/** Клик по кнопке. `target` — короткое понятное имя, например 'hero_bot'. */
export function trackClick(target: string) {
  void send('click', isBrowser ? window.location.pathname : '/', target);
}

/** Досмотр блока — один раз за сессию на каждый блок. */
export function trackSection(sectionId: string) {
  const key = `s:${sectionId}`;
  if (SENT_ONCE.has(key)) return;
  SENT_ONCE.add(key);
  void send('scroll', isBrowser ? window.location.pathname : '/', sectionId);
}

/**
 * Следим за блоками лендинга: как только блок появился в кадре — отмечаем.
 * Возвращает функцию отписки.
 */
export function observeSections(sectionIds: string[]): () => void {
  if (!isBrowser || isOwnVisit() || typeof IntersectionObserver === 'undefined') return () => {};
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting && e.target.id) {
          trackSection(e.target.id);
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.4 },
  );
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
  return () => io.disconnect();
}

/** Помечает браузер администратора, чтобы его визиты не попадали в статистику. */
export function setOwnVisitFlag(isAdmin: boolean) {
  if (!isBrowser) return;
  try {
    if (isAdmin) localStorage.setItem('tlt_is_admin', '1');
  } catch {
    /* ignore */
  }
}
