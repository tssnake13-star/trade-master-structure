import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Lock } from 'lucide-react';
import { ACCENT, BG, BLUE, BORDER, DIM, DISCLAIMER, FG, MONO, SANS, UP, card, label, pill, fmtDate } from '@/components/terminal/theme';
import { ALPHA_TIP, CycleCard, Lines, type MarketRow } from '@/components/terminal/parts';
import TerminalSidebar from '@/components/terminal/Sidebar';
import { Brand, Decision, TradingStyle } from '@/components/terminal/Decision';
import { FalseExitFeed, TrendFeed, VerdictsFeed, type FeedDocs, type Verdict } from '@/components/terminal/Feeds';
import { TimeMachine, type TimeItem } from '@/components/terminal/TimeMachine';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { ScreenerCards } from '@/components/terminal/Screener';
import StatusStrip from '@/components/terminal/Status';
import Boot, { type BootSteps } from '@/components/terminal/Boot';
import '@/styles/echo-fx.css';
import { GEN } from '@/components/terminal/screenerParse';
import LiveChart from '@/components/terminal/LiveChart';
import { HistoryOf, HistoryView } from '@/components/terminal/History';
import { JOURNAL_VIDEOS_KEY, parseJournalVideos, type JournalVideo } from '@/lib/journalVideos';
import { LAYERS, layersOf, type Layer, type Scene } from '@/components/terminal/scene';

// 21.09.2026, его слово: серые ползунки «ужасно смотрятся» — тонкие, золото на тёмном,
// как весь кабинет. Стандартные свойства — Chrome и Firefox, ::-webkit — Safari.
// 27.09.2026, его слово (телефон): у строки вкладок ползунок «весь вид портит» — вкладки листаются свайпом,
// ползунка у них нет (.tm-tabs); у остальных прокруток на странице он прежний.
const SCROLL_CSS = `
html { scrollbar-color: rgba(225,168,77,0.55) ${BG}; }
.tm-page, .tm-page * { scrollbar-width: thin; scrollbar-color: rgba(225,168,77,0.55) transparent; }
.tm-page ::-webkit-scrollbar { width: 8px; height: 8px; }
.tm-page ::-webkit-scrollbar-track { background: transparent; }
.tm-page ::-webkit-scrollbar-thumb { background: rgba(225,168,77,0.55); border-radius: 8px; }
.tm-page ::-webkit-scrollbar-thumb:hover { background: ${ACCENT}; }
.tm-page .tm-tabs { scrollbar-width: none; -ms-overflow-style: none; }
.tm-page .tm-tabs::-webkit-scrollbar { display: none; width: 0; height: 0; }
`;

// запуск терминала (25.10.2026): первый раз за сеанс — не короче 1,5 с, чтобы глаз успел нарисоваться и открыться
const BOOT_MIN = 1500;
const BOOT_SEEN = 'eg_boot_seen';

/**
 * SchoolTerminal — ECHO-GATE INSIDE, под ним «Глаз системы» (/school/terminal).
 * Название — его, 21.09.2026 (вечером; до этого экран звался просто «Глаз системы»).
 * Внутри это терминал рынка.
 *
 * Экран ничего не считает. Всё, что здесь видно, посчитало ядро на VPS и
 * положило в базу: строка на инструмент, три картинки и общие ленты. Поэтому
 * в этом файле нет ни одного правила системы — только показ готового.
 *
 * Доступ — отдельная подписка со сроком (terminal_access). Закрывает её RLS
 * в базе, а не этот код: без действующей подписки запрос возвращает пусто.
 *
 * 07.10.2026, его слово: при регистрации человек сам получает пробный доступ
 * на 7 дней (terminal_access.is_trial). Замки тоже стоят в базе: пробному
 * отдаются только открытые инструменты, итоги решений и журнал решений
 * с задержкой в 3 дня (функция terminal_trial_verdicts; было сутки, 19.10.2026 его слово «задержку надо сделать в три дня»). Скринер, ТОП-лист
 * и тренд он видит закрытыми. Выдача через админку снимает is_trial — открыто всё.
 */

/** Закрытый раздел пробного доступа: что здесь и как открыть */
function TrialLock({ what }: { what: string }) {
  return (
    <div style={{ ...card, padding: 28, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Lock size={22} color={ACCENT} />
      </div>
      <div style={{ fontSize: 16, marginTop: 10, color: FG }}>{what} открывается в подписке</div>
      <p style={{ color: DIM, fontSize: 13, lineHeight: 1.6, maxWidth: 480, margin: '8px auto 0' }}>
        В пробном доступе открыты журнал моих решений с задержкой в 3 дня, итоги решений и несколько
        инструментов целиком. {what} показывает, куда смотреть на этой неделе, и работает у подписчиков.
      </p>
      <a
        href={TELEGRAM_LINKS.dm}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...pill(true), display: 'inline-block', marginTop: 16, padding: '10px 16px', textDecoration: 'none' }}
      >
        Открыть всё: написать Сергею
      </a>
    </div>
  );
}

// Таблицы терминала ещё не попали в сгенерированные типы базы — читаем их
// через клиент без схемы, а форму данных держим интерфейсами (parts, Feeds).
const db = supabase as unknown as SupabaseClient;

interface Meta {
  updated_at: string | null;
  bars_at: string | null;
  build: string | null;
}

// 21.09.2026, его слово: вкладку «Резонанс» из «Глаза системы» убрать
// 21.09.2026: ТОП циклов — своей вкладкой (на телефоне до него под группами было долго листать)
// 27.09.2026, его слово: «переименуй топ циклов… или, наверное, просто топ. Оставь» — вкладка «ТОП»
type Section = 'instrument' | 'screener' | 'top' | 'trend' | 'falsex' | 'verdicts' | 'timemachine' | 'history';
const SECTIONS: [Section, string][] = [
  ['instrument', 'Инструмент'],
  ['screener', 'Скринер'],
  ['top', 'ТОП-ЛИСТ'],   // 03.10.2026, его слово: «переименовать в топ-лист»
  ['trend', 'Тренд'],
  // 23.09.2026, его слово: вкладка — только админу; вечером в ней снова три события — «Выход против недели»
  ['falsex', 'Выход против недели'],
  // 24.09.2026, его слово: «Журнал допусков» — чтобы студент не принял его решения за свои;
  // 25.09.2026, его слово: «переименовать в журнал решений… или даже журнал решений Сергея»
  ['verdicts', 'Журнал решений Сергея'],
  // ⛔ 20.10.2026, его слово: «Машину времени и тренажер лучше убрать из веб-версии. Они там не нужны» — вкладки
  // (были с 18.10.2026) остались только в терминале школьного бота (/tg/school, TgTerminal)
  // ⛔ 21.10.2026, его слово: «Верни машину времени в веб-версию. Но только машину времени… переименуй в сделки до и
  // после» — вкладка вернулась под новым именем, с календарём (TimeMachine); тренажёра нет
  ['timemachine', 'Сделки до и после'],
  // 25.09.2026, его слово: «показывать не один день, а изменения… где ошибается система, где не ошибается»
  ['history', 'История направления'],
];
// 25.09.2026, его слово: «историю направления видел только я, администратор… как выходы против недели… где-нибудь
// отдельно, не с общими кнопками». Эти вкладки — отдельной строкой «администратор» под общими, ученик их не видит,
// и их ленты ему не загружаются вовсе (ключ ленты совпадает с вкладкой)
// 13.10.2026, его слово: «Тренд мы уберём из общего доступа… перенеси её во вкладку администратор. То есть только
// администратор может видеть эту вкладку. Пока что… всё равно ей пока никто не пользуется»
const ADMIN_ONLY: Section[] = ['trend', 'falsex', 'history'];
// пробному под замком (TrialLock) — в строке вкладок идут последними
const TRIAL_LOCKED: Section[] = ['screener', 'top', 'timemachine'];
// ленты, которые бот кладёт в базу сразу после его кнопки: вкладка → ключ ленты (24.09 журнал, 25.09 скринер)
const LIVE_FEED: Partial<Record<Section, string>> = { verdicts: 'verdicts', screener: 'screener', top: 'screener' };

type Tab = 'Анализ' | 'Циклы' | 'Накопления' | 'Рейндж' | 'Как в боте' | 'История';
const TABS: Tab[] = ['Анализ', 'Циклы', 'Накопления', 'Рейндж', 'Как в боте', 'История'];

type Kind = 'cycles' | 'trend' | 'all';
// порядок групп и порядок внутри группы доллара — в components/terminal/Sidebar.tsx (01.10.2026: боковая
// панель вынесена туда целиком — у неё теперь два вида, «группы» и «сценарии»)

// Почему нет сценария — словами бота из первой строки карточки /info
// («🌀 USDCNH — Сценария нет: цель недельного цикла вниз взята; …»)
const noScenReason = (r: MarketRow) => {
  const m = ((r.card_lines || [])[0] || '').match(/—\s*(Сценария нет.*)$/);
  return m ? m[1].trim() : 'Сценария нет.';
};

// высота боковой панели с вкладки «Инструмент» (03.10.2026) — чтобы на других вкладках она была той же
const SIDE_H_KEY = 'tm-side-h';

const KINDS: [Kind, string, string][] = [
  ['cycles', 'сценарий', 'неделя сверху · дневка снизу · циклы сценария'],
  ['trend', 'накопления', 'неделя сверху · дневка снизу · накопления, свинги, реверс'],
  ['all', 'все циклы', 'неделя и дневка · обе стороны · без фильтра сценария'],
];

export default function SchoolTerminal() {
  const { session, user, role, loading: authLoading } = useAuth();
  // 23.09.2026, его слово: «Выход против недели» — только для админа, другим не видна
  const isAdmin = role === 'admin';
  const sections = SECTIONS.filter(([s]) => !ADMIN_ONLY.includes(s) || isAdmin);
  const mainSections = sections.filter(([s]) => !ADMIN_ONLY.includes(s));
  const adminSections = sections.filter(([s]) => ADMIN_ONLY.includes(s));
  // вкладка «История» у инструмента — тоже только ему
  const tabs = TABS.filter((t) => t !== 'История' || isAdmin);
  // ленты «только администратору» ученику не запрашиваются
  const feedQuery = useCallback(() => {
    const q = db.from('market_feed').select('key, data, updated_at');
    // 18.10.2026: verdicts_crypto — его решения по крипте «только мне», ученику не запрашивается (и база не отдаёт)
    // 20.10.2026: лента timemachine большая — в общую загрузку не входит; с 21.10.2026 её грузит вкладка «Сделки до и
    // после», когда её открыли (tmDoc)
    const skip = isAdmin ? ['timemachine'] : [...ADMIN_ONLY, 'verdicts_crypto', 'timemachine'];
    return q.not('key', 'in', `(${skip.join(',')})`);
  }, [isAdmin]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [rows, setRows] = useState<MarketRow[]>([]);
  const [feeds, setFeeds] = useState<FeedDocs>({});
  // 25.09.2026: серии «Допуск-отказ» для журнала решений — список правит админ («Разборы допусков»)
  const [videos, setVideos] = useState<JournalVideo[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  // 07.10.2026: пробный доступ — что под замком и сколько решений ещё скрыто задержкой
  const [trial, setTrial] = useState(false);
  const [lockedList, setLockedList] = useState<{ symbol: string; title: string | null }[]>([]);
  const [hiddenVerdicts, setHiddenVerdicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // 25.10.2026, его выбор «A-C-D вместе»: пока грузятся данные — запуск (строки готовности по настоящим запросам),
  // потом скан открывает окно (scan), дальше окно живёт. Первый раз за сеанс запуск стоит не меньше BOOT_MIN,
  // чтобы глаз успел нарисоваться и открыться; потом — ровно столько, сколько грузятся данные
  const [boot, setBoot] = useState<BootSteps>({ access: false, market: false, feeds: false });
  const bootAt = useRef(typeof performance === 'undefined' ? 0 : performance.now());
  const [bootHold, setBootHold] = useState(true);
  const [scan, setScan] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('Анализ');
  const [kind, setKind] = useState<Kind>('cycles');
  const [pic, setPic] = useState<string | null>(null);
  const [wide, setWide] = useState(typeof window === 'undefined' ? true : window.innerWidth >= 1100);
  // телефон: кнопки слоёв — под одной «слои», чтобы не занимали полэкрана
  const [phone, setPhone] = useState(typeof window === 'undefined' ? false : window.innerWidth < 700);
  const [showLayers, setShowLayers] = useState(false);
  // часы для строки свежести: «онлайн» считается от текущего времени, раз в минуту
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);
  const [full, setFull] = useState(false);
  // 23.09.2026, его слово: увеличенная картинка прокручивается колесом (дневка внизу, за краем
  // экрана) — пока она открыта, страница под ней стоит; Esc закрывает
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [full]);
  // живой график (заход 3): те же фигуры, что на картинке бота, данными.
  // 22.09.2026: с телефона — картинка, с компьютера и планшета — живой график.
  // 23.09.2026 (снято 29.09): «картинку как в боте по умолчанию везде, на компьютере тоже».
  // 29.09.2026, его слово: «верни по умолчанию живой график в компьютерной версии» — снова как 22.09.
  // Телефон — по меньшей стороне экрана (< 600 px): и повёрнутый боком остаётся телефоном.
  const [live, setLive] = useState(() =>
    typeof window === 'undefined' ? true : Math.min(window.screen.width, window.screen.height) >= 600,
  );
  const [scene, setScene] = useState<Scene | null>(null);
  const [hidden, setHidden] = useState<Set<Layer>>(new Set());

  const selected = params.get('i');
  // 18.10.2026, его слово про пробный режим: «первое это должны быть решения… мои… замки можно назад убрать» — пробному
  // без ?s= открывается журнал решений
  const section = (sections.find(([s]) => s === params.get('s'))?.[0] || (trial ? 'verdicts' : 'instrument')) as Section;

  // 21.10.2026: «Сделки до и после» — лента timemachine большая, в общую загрузку не входит (feedQuery её пропускает):
  // грузим, когда открыта вкладка, один раз за посещение. Пробному база её не отдаёт — у него замок
  const [tmDoc, setTmDoc] = useState<{ items?: TimeItem[] } | null>(null);
  useEffect(() => {
    if (!user || trial || section !== 'timemachine' || tmDoc) return;
    let alive = true;
    db.from('market_feed').select('data').eq('key', 'timemachine').maybeSingle().then(({ data }) => {
      if (alive) setTmDoc((data as { data?: { items?: TimeItem[] } } | null)?.data || { items: [] });
    });
    return () => {
      alive = false;
    };
  }, [user, trial, section, tmDoc]);

  // ⛔ 03.10.2026, его слово: боковая панель «привязана к нижней карточке графика… на других вкладках уменьшается,
  // увеличивается… надо её зафиксировать, как она есть на вкладке инструмент». Высота ряда на вкладке «Инструмент»
  // запоминается (и в браузере — если страница открыта сразу на другой вкладке); на остальных вкладках панель стоит
  // ровно этой высоты и от их содержимого не зависит
  // элемент — через состояние, а не useRef: ряд появляется только после загрузки витрины, и замер должен
  // включиться в этот момент (с useRef эффект уже отработал на пустом месте и больше не запускался)
  const [sideEl, setSideEl] = useState<HTMLDivElement | null>(null);
  const [sideH, setSideH] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const v = Number(window.localStorage.getItem(SIDE_H_KEY));
      return v > 0 ? v : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const el = sideEl;
    if (!wide || section !== 'instrument' || !el) return;
    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h <= 0) return;
      setSideH(h);
      try {
        window.localStorage.setItem(SIDE_H_KEY, String(h));
      } catch {
        // хранилище браузера закрыто — высота живёт до перезагрузки страницы
      }
    };
    // сразу при открытии вкладки, дальше — на каждое изменение высоты ряда (график догрузился, сменился инструмент);
    // наблюдатель в фоновой вкладке молчит, поэтому первый замер — без него
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wide, section, sideEl]);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    const onResize = () => {
      setWide(window.innerWidth >= 1100);
      setPhone(window.innerWidth < 700);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // время каждой ленты, которая уже на экране (24.09.2026 — журнал допусков, 25.09.2026 — скринер):
  // его пишет загрузка лент
  const feedAt = useRef<Record<string, string | null>>({});
  const load = useCallback(async () => {
    // строка готовности на экране запуска загорается, когда пришёл свой запрос
    const step = <T,>(p: PromiseLike<T>, k: keyof BootSteps) =>
      Promise.resolve(p).then((r) => {
        setBoot((b) => (b[k] ? b : { ...b, [k]: true }));
        return r;
      });
    const [accessRes, metaRes, rowsRes, feedRes, videoRes] = await Promise.all([
      step(
        user
          // '*' — чтобы читать is_trial и не падать, пока столбца ещё нет в базе
          ? db.from('terminal_access').select('*').eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        'access',
      ),
      db.from('market_meta').select('updated_at, bars_at, build').maybeSingle(),
      step(db.from('market_snapshot').select('*').order('sort_order').order('symbol'), 'market'),
      step(feedQuery(), 'feeds'),
      db.from('site_settings').select('value').eq('key', JOURNAL_VIDEOS_KEY).maybeSingle(),
    ]);
    setVideos(parseJournalVideos((videoRes.data as { value?: string } | null)?.value));
    const acc = accessRes.data as { expires_at?: string; is_trial?: boolean } | null;
    setUntil(acc?.expires_at || null);
    const isTrial = !isAdmin && !!acc?.is_trial && !!acc.expires_at && new Date(acc.expires_at).getTime() > Date.now();
    setTrial(isTrial);
    setMeta((metaRes.data as Meta) || null);
    const marketRows = (rowsRes.data || []) as MarketRow[];
    setRows(marketRows);
    const docs: FeedDocs = {};
    for (const f of (feedRes.data || []) as { key: keyof FeedDocs; data: never; updated_at?: string }[]) {
      docs[f.key] = f.data;
      feedAt.current[f.key] = f.updated_at || null;
    }
    if (isTrial) {
      // журнал решений пробному — только решения старше 3 дней; список закрытых инструментов — одни названия
      const [vRes, cRes] = await Promise.all([db.rpc('terminal_trial_verdicts'), db.rpc('terminal_trial_catalog')]);
      const v = vRes.data as { items?: Verdict[]; hidden?: (string | null)[] } | null;
      docs.verdicts = { items: v?.items || [] };
      setHiddenVerdicts((v?.hidden || []).filter((t): t is string => !!t));
      const open = new Set(marketRows.map((r) => r.symbol));
      setLockedList(((cRes.data || []) as { symbol: string; title: string | null }[]).filter((c) => !open.has(c.symbol)));
    }
    setFeeds(docs);
    setLoading(false);
  }, [user, feedQuery, isAdmin]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  // запуск → скан → окно. Данные пришли: первый раз за сеанс дожидаемся BOOT_MIN с открытия, потом снимаем запуск
  // и пускаем скан (1,5 с, см. echo-fx.css .tm-scan)
  useEffect(() => {
    if (authLoading || loading) return;
    let first = true;
    try {
      first = !sessionStorage.getItem(BOOT_SEEN);
      sessionStorage.setItem(BOOT_SEEN, '1');
    } catch { /* без хранилища — как в первый раз */ }
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = first && !calm ? Math.max(0, BOOT_MIN - (performance.now() - bootAt.current)) : 0;
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      setBootHold(false);
      if (calm) return;
      setScan(true);
      t2 = window.setTimeout(() => setScan(false), 1600);
    }, wait);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [authLoading, loading]);

  // Раз в минуту смотрим только время расчёта — строка крошечная. Сошлось —
  // ничего не трогаем, изменилось — перечитываем витрину целиком.
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(async () => {
      const { data } = await db.from('market_meta').select('updated_at').maybeSingle();
      const fresh = (data as { updated_at?: string } | null)?.updated_at || null;
      if (fresh && fresh !== meta?.updated_at) load();
    }, 60000);
    return () => window.clearInterval(t);
  }, [user, meta?.updated_at, load]);

  // 24.09.2026, его слово: «чтобы в журнале допусков допуски появлялись сразу, как я отправил свой
  // вердикт… через 2-3 секунды». Бот кладёт журнал в базу сразу после его кнопки; пока открыт «Журнал
  // допусков», раз в 3 секунды смотрим время журнала (строка крошечная) и перечитываем ленты, когда
  // оно изменилось. На остальных вкладках — как было, раз в минуту по времени расчёта.
  // 25.09.2026, его слово: «со скринером так же, как и с допуском: нажимаю ОДОБРЯЮ — в тот же момент,
  // как скринер приходит подписчикам, он сразу и в терминал». Бот кладёт ленту скринера в базу сразу
  // после его кнопки; «Скринер» и «ТОП» (обе из неё) смотрят её время так же, раз в 3 секунды.
  useEffect(() => {
    const key = LIVE_FEED[section];
    // пробному живые ленты не отдаются вовсе (замки в базе) — опрашивать нечего
    if (!user || !key || trial) return;
    let alive = true;
    const tick = async () => {
      const { data } = await db.from('market_feed').select('updated_at').eq('key', key).maybeSingle();
      const at = (data as { updated_at?: string } | null)?.updated_at || null;
      if (!alive || !at) return;
      if (at !== feedAt.current[key]) {
        const { data: fd } = await feedQuery();
        if (!alive) return;
        const docs: FeedDocs = {};
        for (const f of (fd || []) as unknown as { key: keyof FeedDocs; data: never; updated_at?: string }[]) {
          docs[f.key] = f.data;
          feedAt.current[f.key] = f.updated_at || null;
        }
        setFeeds(docs);
      }
      feedAt.current[key] = at;
    };
    tick();
    const t = window.setInterval(tick, 3000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [user, section, feedQuery, trial]);

  // 25.09.2026, его вопрос «почему нету кнопки разбор» у биткоина в журнале решений: бот пишет решение
  // под именем из MT5 (BTCUSD), а строка терминала названа по скринеру (BTCUSDT) — имена не сошлись,
  // кнопки не было. Имя без «T» ведёт на строку с «T»; сам журнал не трогаем — по нему сходятся итоги недели.
  const rowOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.symbol, r.symbol);
    for (const r of rows) if (/USDT$/.test(r.symbol) && !m.has(r.symbol.slice(0, -1))) m.set(r.symbol.slice(0, -1), r.symbol);
    return m;
  }, [rows]);
  const symbols = useMemo(() => new Set(rowOf.keys()), [rowOf]);

  const list = useMemo(() => {
    const q = query.trim().toUpperCase();
    return rows.filter((r) => !q || r.symbol.includes(q) || (r.title || '').toUpperCase().includes(q));
  }, [rows, query]);

  // раскладка левого списка по группам и по сценариям — в components/terminal/Sidebar.tsx (groupRows, scenarioRows)

  const cur = useMemo(() => rows.find((r) => r.symbol === selected) || rows[0] || null, [rows, selected]);

  const go = useCallback(
    (s: Section, sym?: string) => {
      const next: Record<string, string> = { s };
      const i = sym || cur?.symbol;
      if (i) next.i = i;
      setParams(next, { replace: s === section });
      window.scrollTo({ top: 0 });
    },
    [cur?.symbol, section, setParams],
  );
  const openSymbol = useCallback((sym: string) => go('instrument', rowOf.get(sym) || sym), [go, rowOf]);

  // Картинки лежат в закрытом ящике: ссылка живёт час и только для вошедшего.
  useEffect(() => {
    let alive = true;
    const path = kind === 'cycles' ? cur?.chart_cycles : kind === 'trend' ? cur?.chart_trend : cur?.chart_all;
    setPic(null);
    if (!path) return;
    supabase.storage
      .from('terminal')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setPic(data?.signedUrl || null);
      });
    return () => {
      alive = false;
    };
  }, [cur?.symbol, cur?.chart_cycles, cur?.chart_trend, cur?.chart_all, kind, meta?.updated_at]);

  // Данные живого графика: только если есть сама картинка этого вида — иначе
  // сценария нет, и живому графику показывать нечего (как и в боте).
  useEffect(() => {
    let alive = true;
    setScene(null);
    const has = kind === 'cycles' ? cur?.chart_cycles : kind === 'trend' ? cur?.chart_trend : cur?.chart_all;
    const sym = cur?.symbol;
    if (!sym || !has || !live) return;
    db.from('market_chart')
      .select('scene')
      .eq('symbol', sym)
      .eq('kind', kind)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setScene(((data as { scene?: Scene } | null)?.scene) || null);
      });
    return () => {
      alive = false;
    };
  }, [cur?.symbol, cur?.chart_cycles, cur?.chart_trend, cur?.chart_all, kind, live, meta?.updated_at]);

  const present = useMemo(() => layersOf(scene), [scene]);

  if (authLoading || loading || bootHold) return <Boot steps={boot} />;

  if (!rows.length && !trial) {
    // 07.10.2026: у кого пробный доступ закончился, видят «срок закончился», а не «не открыт»
    const expired = !!until && new Date(until).getTime() <= Date.now();
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, color: FG, fontFamily: SANS, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ ...card, padding: 28, maxWidth: 520, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Brand />
          </div>
          <h1 style={{ fontSize: 22, margin: '14px 0 10px' }}>{expired ? 'Срок доступа закончился' : 'Доступ пока не открыт'}</h1>
          <p style={{ color: DIM, fontSize: 14, lineHeight: 1.6 }}>
            {/* 20.10.2026, его «цену открываем: в боте и на сайте» */}
            ECHO-GATE INSIDE открывается подпиской, первый месяц стоит $199. Все цены на странице цен,
            а подключиться можно, написав Сергею. Если подписка у вас есть, а экран пустой, тоже напишите: откроем.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...pill(true), padding: '11px 18px', textDecoration: 'none' }}
            >
              написать Сергею
            </a>
            <button onClick={() => navigate('/#formats')} style={{ ...pill(false), padding: '11px 18px' }}>
              цены
            </button>
            <button onClick={() => navigate('/school/dashboard')} style={{ ...pill(false), padding: '11px 18px' }}>
              в кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 07.10.2026: сколько дней пробного доступа осталось — для плашки сверху
  const trialDays = trial && until ? Math.max(1, Math.ceil((new Date(until).getTime() - now) / 86400000)) : 0;

  // 01.10.2026, его слово: в боковой панели две вкладки — «группы» (как было) и «сценарии»; сама панель —
  // components/terminal/Sidebar.tsx. Выбранный инструмент подсвечен только на вкладке «Инструмент», как раньше
  const sidebar = (
    <TerminalSidebar
      rows={rows}
      list={list}
      query={query}
      onQuery={setQuery}
      selected={section === 'instrument' ? cur?.symbol || null : null}
      onOpen={openSymbol}
      wide={wide}
      trial={trial}
    />
  );

  // знаков после точки — как у цены инструмента (у золота 2, у евро 5)
  const cycDg = cur?.price_text?.includes('.') ? cur.price_text.split('.')[1].length : 4;
  // 21.09.2026, его просьба по макету: цикл со столбиком «пройдено» — неделя синим, дневка зелёным
  const cycles = cur && (
    <>
      <CycleCard title="цикл недели" c={cur.cycle_w1} color={BLUE} dg={cycDg} />
      <CycleCard title="цикл дневки" c={cur.cycle_d1} color={UP} dg={cycDg} />
    </>
  );

  const right = cur && (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...pill(tab === t), padding: '5px 9px' }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Анализ' && (
        <div>
          {/* 21.09.2026, его слово: инструмент, сценарий, неделя и дневка здесь повторяли
              верхний блок — «лишняя информация»; главное теперь только наверху */}
          {[['свечи закрыты по', fmtDate(cur.bars_at)]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: DIM, fontSize: 12 }}>{k}</span>
              <span style={{ color: FG, fontFamily: MONO, fontSize: 12, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          <div style={{ ...label, marginTop: 14 }}>накопления</div>
          <div style={{ color: FG, fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
            неделя: {cur.trend_w1 || '—'}
            <br />
            дневка: {cur.trend_d1 || '—'}
            <br />
            {cur.trend_total ? <span style={{ color: ACCENT }}>{cur.trend_total}</span> : null}
          </div>
          <div style={{ marginTop: 14 }}>{cycles}</div>
        </div>
      )}
      {tab === 'Циклы' && <div>{cycles}</div>}
      {tab === 'Накопления' && <Lines lines={cur.trend_lines} />}
      {tab === 'Рейндж' && <Lines lines={cur.range_lines} />}
      {tab === 'Как в боте' && <Lines lines={cur.card_lines} />}
      {tab === 'История' && isAdmin && <HistoryOf doc={feeds.history} symbol={cur.symbol} />}
    </div>
  );

  const instrument = cur && (
    <>
      <div style={{ ...card, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0, fontFamily: MONO, letterSpacing: '0.04em' }}>{cur.symbol}</h1>
          <span style={{ color: DIM, fontSize: 13 }}>{cur.title}</span>
          {cur.extra?.leads ? (
            <span
              title={cur.extra.leads === 'DXY' ? ALPHA_TIP : undefined}
              style={{ fontSize: 12, color: ACCENT, border: `1px solid ${ACCENT}55`, borderRadius: 6, padding: '1px 8px' }}
            >
              {`поводырь группы ${GEN[cur.extra.leads] || cur.extra.leads}`}
            </span>
          ) : null}
          <span style={{ fontFamily: MONO, fontSize: 18, marginLeft: 'auto' }}>{cur.price_text || '—'}</span>
        </div>
        {/* 21.09.2026, его слово: направление, сценарий, подтверждение, поводырь и критерии
            недели и дневки — самое главное об инструменте: крупно, по центру, одним блоком */}
        <Decision r={cur} narrow={phone} />
      </div>

      <div style={{ ...card, padding: 12 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {KINDS.map(([k, name]) => (
            <button key={k} onClick={() => setKind(k)} style={pill(kind === k)}>
              {name}
            </button>
          ))}
          <span style={{ ...label, marginLeft: 'auto' }}>{KINDS.find(([k]) => k === kind)?.[2]}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setLive(true)} style={{ ...pill(live), padding: '4px 9px' }}>
            живой график
          </button>
          <button onClick={() => setLive(false)} style={{ ...pill(!live), padding: '4px 9px' }}>
            картинка как в боте
          </button>
          {live && scene && phone ? (
            <button onClick={() => setShowLayers(!showLayers)} style={{ ...pill(showLayers), padding: '4px 9px' }}>
              слои {showLayers ? '▴' : '▾'}
            </button>
          ) : null}
          {live && scene && (showLayers || !phone)
            ? LAYERS.filter(([L]) => present.has(L)).map(([L, name]) => (
                <button
                  key={L}
                  onClick={() =>
                    setHidden((h) => {
                      const n = new Set(h);
                      if (n.has(L)) n.delete(L);
                      else n.add(L);
                      return n;
                    })
                  }
                  style={{ ...pill(false), padding: '4px 9px', color: hidden.has(L) ? '#55504a' : FG, textDecoration: hidden.has(L) ? 'line-through' : 'none' }}
                >
                  {name}
                </button>
              ))
            : null}
        </div>
        {live && scene ? (
          <LiveChart scene={scene} hidden={hidden} noHead />
        ) : pic ? (
          <img
            src={pic}
            alt={`${cur.symbol} ${KINDS.find(([k]) => k === kind)?.[1]}`}
            onClick={() => setFull(true)}
            style={{ width: '100%', borderRadius: 10, display: 'block', cursor: 'zoom-in' }}
          />
        ) : (
          <div style={{ color: DIM, fontSize: 13, padding: 24, textAlign: 'center', lineHeight: 1.6 }}>
            {/* 21.09.2026, его вопрос по USDCNH: «нет графика или нет CSV?» — говорим прямо, что из двух */}
            {!cur.bars_at
              ? 'Свечей нет: ни CSV из терминала, ни символа в MT5 сервера — посчитать нечего.'
              : kind === 'cycles' && !cur.scenario
                ? `Данные есть — свечи закрыты по ${fmtDate(cur.bars_at)}. ${noScenReason(cur)} Картинку сценария бот рисует, только когда сценарий есть. Накопления и все циклы — на соседних вкладках.`
                : `Данные есть — свечи закрыты по ${fmtDate(cur.bars_at)}, но картинка при последнем обновлении не построилась. Появится со следующим обновлением.`}
          </div>
        )}
      </div>
      {!wide && right ? <div style={{ marginTop: 14 }}>{right}</div> : null}
    </>
  );

  return (
    <div className="tm-page" style={{ minHeight: '100vh', backgroundColor: BG, color: FG, fontFamily: SANS, position: 'relative' }}>
      <style>{SCROLL_CSS}</style>
      {/* 21.09.2026, его слово: бегущая по экрану почта здесь лишняя — «на видео такая защита
          прокатит, а здесь зачем». В уроках с видео она осталась. */}
      {/* 25.10.2026, «скан»: после запуска золотая черта открывает окно сверху вниз */}
      {scan ? <div className="tm-scan" aria-hidden="true" /> : null}

      {/* 25.10.2026, «живой терминал»: в шапке еле заметно плывёт сетка */}
      <header className="tm-head-live" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <span className="tm-grid" aria-hidden="true" />
        <button
          onClick={() => navigate('/school/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: DIM, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11 }}
        >
          <ArrowLeft size={14} /> кабинет
        </button>
        {/* название — его, 21.09.2026: как плитка в кабинете — глаз на две строки; на скане глаз открывается */}
        <div className={scan ? 'tm-eye-open' : undefined}>
          <Brand />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <StatusStrip updatedAt={meta?.updated_at || null} feeds={feeds} now={now} />
          {until ? <span style={label}>{trial ? 'пробный доступ до' : 'подписка до'} {fmtDate(until)}</span> : null}
        </div>
      </header>

      {/* 07.10.2026: плашка пробного доступа — что открыто, что под замком, как открыть всё */}
      {trial ? (
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ ...card, padding: 14, border: `1px solid ${ACCENT}55` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* 11.10.2026: в последние 2 дня плашка говорит «осталось» и теплеет, чтобы конец не был сюрпризом */}
              <span style={{ ...label, color: trialDays <= 2 ? '#e8a05a' : ACCENT, whiteSpace: 'nowrap' }}>
                пробный доступ · {trialDays <= 2 ? (trialDays === 1 ? 'остался ' : 'осталось ') : ''}
                {trialDays} {trialDays === 1 ? 'день' : trialDays < 5 ? 'дня' : 'дней'}
              </span>
              <span style={{ color: FG, fontSize: 13, lineHeight: 1.6, flex: '1 1 360px' }}>
                Открыты журнал моих решений с задержкой в 3 дня, итоги решений
                {rows.length ? ` и ${rows.map((r) => r.symbol).join(', ')} целиком` : ''}. В подписке мой вердикт
                приходит сразу, в терминал и в Telegram, и открываются скринер, ТОП-лист, тренд и остальные инструменты.
              </span>
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...pill(true), padding: '9px 14px', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Открыть всё
              </a>
            </div>
            {lockedList.length ? (
              <div style={{ color: DIM, fontSize: 12, marginTop: 10, lineHeight: 1.7, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Lock size={11} color={DIM} style={{ flexShrink: 0, alignSelf: 'center' }} />
                <span>
                  под замком {lockedList.length}: {lockedList.slice(0, 16).map((c) => c.symbol).join(' · ')}
                  {lockedList.length > 16 ? ` и ещё ${lockedList.length - 16}` : ''}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 30.09.2026, его слово: стиль торговли — над кнопками разделов, крупнее */}
      <div style={{ padding: '14px 14px 0' }}>
        <TradingStyle />
      </div>

      <nav className="tm-tabs" style={{ display: 'flex', gap: 6, padding: '12px 14px 0', overflowX: 'auto' }}>
        {/* 18.10.2026, его слово: в пробном режиме как с курсами — сначала то, что открыто (журнал решений первым),
            вкладки под замком — в конце и с замком */}
        {(trial
          ? [
              ...mainSections.filter(([s]) => s === 'verdicts'),
              ...mainSections.filter(([s]) => s !== 'verdicts' && !TRIAL_LOCKED.includes(s)),
              ...mainSections.filter(([s]) => TRIAL_LOCKED.includes(s)),
            ]
          : mainSections
        ).map(([s, name]) => {
          const locked = trial && TRIAL_LOCKED.includes(s);
          return (
            <button
              key={s}
              onClick={() => go(s)}
              className={section === s ? 'tm-pill-on' : undefined}
              style={{ ...pill(section === s), ...(locked && section !== s ? { opacity: 0.55, borderStyle: 'dashed' } : null), display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              {locked ? <Lock size={10} /> : null}
              {name}
              {/* 25.10.2026, «живой терминал»: по выбранной вкладке бежит луч */}
              {section === s ? <span className="tm-beam" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </nav>
      {/* 25.09.2026, его слово: вкладки только для него — отдельно от общих кнопок, своей строкой */}
      {adminSections.length ? (
        <nav className="tm-tabs" style={{ display: 'flex', gap: 6, padding: '8px 14px 0', overflowX: 'auto', alignItems: 'center' }}>
          <span style={{ ...label, display: 'flex', alignItems: 'center', gap: 5, marginRight: 4, whiteSpace: 'nowrap' }}>
            <Lock size={11} color={ACCENT} /> администратор
          </span>
          {adminSections.map(([s, name]) => (
            <button key={s} onClick={() => go(s)} style={{ ...pill(section === s), borderStyle: section === s ? 'solid' : 'dashed' }}>
              {name}
            </button>
          ))}
        </nav>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: wide ? (section === 'instrument' ? '240px minmax(0, 1fr) 330px' : '240px minmax(0, 1fr)') : '1fr', gap: 14, padding: 14 }}>
        {/* ⛔ 03.10.2026, его слово: «список заканчивался вместе с графиком… если не помещается — прокрутка»: на компьютере
            высоту ряда задают график и карточки, панель инструментов растягивается на неё и листается внутри
            (раньше длинный список уводил страницу вниз, и дисклеймер оказывался далеко под графиком) */}
        {wide ? (
          <div
            ref={setSideEl}
            style={
              section === 'instrument' || !sideH
                ? { position: 'relative', minHeight: 520 }
                : { position: 'relative', height: Math.max(520, sideH), alignSelf: 'start' }
            }
          >
            <div style={{ position: 'absolute', inset: 0 }}>{sidebar}</div>
          </div>
        ) : (
          sidebar
        )}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {section === 'instrument' && instrument}
          {section === 'screener' && (trial ? <TrialLock what="Скринер" /> : <ScreenerCards doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />)}
          {section === 'top' && (trial ? <TrialLock what="ТОП-лист" /> : <ScreenerCards part="top" doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />)}
          {section === 'trend' && isAdmin && <TrendFeed doc={feeds.trend} symbols={symbols} onOpen={openSymbol} />}
          {section === 'falsex' && isAdmin && <FalseExitFeed doc={feeds.falsex} symbols={symbols} onOpen={openSymbol} />}
          {section === 'verdicts' && trial && hiddenVerdicts.length ? (
            <div style={{ ...card, padding: 12, marginBottom: 14, color: DIM, fontSize: 13, lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Lock size={13} color={ACCENT} style={{ flexShrink: 0 }} />
              <span>
                Решений за последние 3 дня: {hiddenVerdicts.length}. В пробном доступе они открываются через 3 дня
                после публикации, у подписчиков приходят сразу.
              </span>
            </div>
          ) : null}
          {section === 'verdicts' && <VerdictsFeed doc={feeds.verdicts} outcomes={feeds.outcomes} videos={videos} symbols={symbols} onOpen={openSymbol} privateCrypto={isAdmin ? feeds.verdicts_crypto || { items: [] } : undefined} seenKey={user?.id} fx />}
          {/* пробному лента timemachine базой не отдаётся (правило market_feed_select) — замок, а не пустая вкладка */}
          {section === 'timemachine' &&
            (trial ? (
              <TrialLock what="Сделки до и после" />
            ) : tmDoc ? (
              <TimeMachine doc={tmDoc} symbols={symbols} onOpen={openSymbol} />
            ) : (
              <div style={{ ...card, padding: 16, color: DIM, fontSize: 13 }}>Загружаю сделки до и после…</div>
            ))}
          {section === 'history' && isAdmin && <HistoryView doc={feeds.history} order={rows.map((r) => r.symbol)} symbols={symbols} onOpen={openSymbol} />}
          <div style={{ ...label, marginTop: 'auto', paddingTop: 14, lineHeight: 1.7 }}>
            {DISCLAIMER}
          </div>
        </div>
        {wide && section === 'instrument' ? right : null}
      </div>

      {full && pic ? (
        // 23.09.2026: картинка во всю ширину (не больше своего размера), слой прокручивается колесом —
        // неделя сверху, до дневки доезжаем вниз; прокрутка не уходит в страницу под картинкой
        <div
          onClick={() => setFull(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 60, overflowY: 'auto', overscrollBehavior: 'contain', padding: 16, cursor: 'zoom-out' }}
        >
          <img
            src={pic}
            alt={cur?.symbol || ''}
            style={{ display: 'block', width: '100%', maxWidth: 'max-content', height: 'auto', margin: '0 auto', borderRadius: 10 }}
          />
        </div>
      ) : null}
    </div>
  );
}
