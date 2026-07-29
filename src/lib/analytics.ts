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

/**
 * Визит владельца. Такие заходы НЕ выбрасываем, а помечаем: в основную
 * статистику они не попадают, но видны отдельным блоком в дашборде.
 *
 * Браузер помечается двумя способами:
 *   1) автоматически — при входе в кабинет под админом;
 *   2) вручную — открыть сайт с ?owner=1 (удобно для телефона, где в кабинет
 *      не заходили). Снять пометку: ?owner=0.
 */
function isOwnerVisit(): boolean {
  if (!isBrowser) return false;
  try {
    const flag = new URLSearchParams(window.location.search).get('owner');
    if (flag === '1') localStorage.setItem('tlt_is_admin', '1');
    if (flag === '0') localStorage.removeItem('tlt_is_admin');
    return localStorage.getItem('tlt_is_admin') === '1';
  } catch {
    return false;
  }
}

/** Локальная разработка в статистику не идёт вообще. */
function isLocalDev(): boolean {
  if (!isBrowser) return false;
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

async function send(event_type: 'pageview' | 'scroll' | 'click', path: string, target?: string) {
  if (!isBrowser || isLocalDev()) return;
  try {
    await supabase.rpc('track_event', {
      _session_id: sessionId(),
      _event_type: event_type,
      _path: path.slice(0, 255),
      _target: target ?? null,
      _referrer: document.referrer ? new URL(document.referrer).hostname.slice(0, 255) : null,
      _source: detectSource(),
      _device: device(),
      _is_owner: isOwnerVisit(),
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
  if (!isBrowser || isLocalDev() || typeof IntersectionObserver === 'undefined') return () => {};

  const observers: IntersectionObserver[] = [];
  const vh = window.innerHeight || 800;

  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;

    // Порог считаем от высоты блока, а не фиксированные 40%. Иначе длинные блоки
    // на телефоне не засчитываются НИКОГДА: например, «Тарифы» высотой 3444px в
    // экран 812px влезают максимум на 24% — условие 40% недостижимо физически.
    // Теперь блок считается просмотренным, когда он занял половину экрана
    // (для коротких блоков это не больше 50% их площади).
    const h = el.getBoundingClientRect().height || 1;
    const threshold = Math.max(0.05, Math.min(0.5, (vh * 0.5) / h));

    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) {
            trackSection(e.target.id);
            io.unobserve(e.target);
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    observers.push(io);
  }

  return () => observers.forEach(io => io.disconnect());
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
