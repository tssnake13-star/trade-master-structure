import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ACCENT, BG, BORDER, DIM, FG, MONO, pill } from '@/components/terminal/theme';
import { Decision } from '@/components/terminal/Decision';
import type { MarketRow } from '@/components/terminal/parts';
import { VerdictsFeed, type FeedDocs } from '@/components/terminal/Feeds';
import { ScreenerCards } from '@/components/terminal/Screener';
import { TimeMachine, Trainer, TmViewCtx, type TimeItem } from '@/components/terminal/TimeMachine';
import { parseJournalVideos } from '@/lib/journalVideos';
import { SCEN_META, groupRows, scenarioRows } from '@/components/terminal/sidebarRows';
import { GEN } from '@/components/terminal/screenerParse';
import { UP, DOWN } from '@/components/terminal/theme';
import { ECOSYSTEM, STUDY_PRICES } from '@/lib/prices';

/**
 * 18.10.2026, его слово «Все, давай внедряй»: терминал внутри Телеграма — кнопка «Терминал» в меню бота.
 *  /tg/echo   — бот Echo-Gate, подписчики: Инструмент · Скринер · ТОП-лист · Решения;
 *  /tg/school — школьный бот, холодные: Решения · Инструмент (инструменты пробы) · Машина времени · Тренажёр · Цены
 *  (20.10.2026: цены подписки и обучения, не выходя из Телеграма; открыты всем).
 * Его слово: «графики должны быть статичные, как в боте» — картинки бота, в машине времени рисунок бота без
 * масштаба и сдвига. Кто открыл, проверяет база (tg_terminal) по подписи Телеграма; без подписки — экран-объяснение.
 */

type Bot = 'echo' | 'school';
type Tab = 'inst' | 'scr' | 'top' | 'dec' | 'tm' | 'tr' | 'price';
const TABS: Record<Bot, [Tab, string, string][]> = {
  echo: [['inst', 'Инструмент', '📈'], ['scr', 'Скринер', '🔎'], ['top', 'ТОП-лист', '🏆'], ['dec', 'Решения', '📋']],
  // 20.10.2026, его «вкладка «Цены» в терминале школьного бота, кнопки «Все цены» ведут в неё» (&tab=price)
  school: [['dec', 'Решения', '📋'], ['inst', 'Инструмент', '📈'], ['tm', 'Машина времени', '🕰'], ['tr', 'Тренажёр', '🎯'], ['price', 'Цены', '🏷']],
};
// вкладки, открытые и после пробы, и до вопросов: журнал решений и цены
const ALWAYS_OPEN: Tab[] = ['dec', 'price'];
const SU = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

interface TgData {
  ok: boolean;
  reason?: string;
  pub?: string | null;
  admin?: boolean;
  // 18.10.2026 вечер: школьный бот после 7 дней — только журнал решений (база отдаёт limited)
  limited?: boolean;
  rows?: MarketRow[];
  feeds?: FeedDocs & { timemachine?: { items?: TimeItem[] } };
  videos?: string | null;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; openLink?: (u: string) => void; openTelegramLink?: (u: string) => void; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } };
  }
}

// 19.10.2026: куда ведёт кнопка с экрана, где дальше идти некуда
const BOT_URL = 'https://t.me/New_TradeLikeTYO_bot';
const SERGEY_URL = 'https://t.me/tradeliketyo';
// 20.10.2026, разбор воронки, пункт 5: бот ставит метку n=1 тому, кто ещё не ответил на 4 вопроса. Ему открыт журнал,
// остальное откроется после вопросов. Метка только для текста, доступ решает база по пропуску
const AFTER_QUIZ = 'Проверка сделки, инструменты, машина времени и тренажёр откроются на 7 дней после 4 коротких вопросов в боте.';

function go(url: string) {
  const w = window.Telegram?.WebApp;
  if (url.startsWith('https://t.me/') && w?.openTelegramLink) w.openTelegramLink(url);
  else if (w?.openLink) w.openLink(url);
  else window.open(url, '_blank');
}

function NextBtn({ label, url }: { label: string; url: string }) {
  return (
    <button
      onClick={() => go(url)}
      style={{ background: ACCENT, color: '#0a0a0a', border: 'none', borderRadius: 10, padding: '11px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
    >
      {label}
    </button>
  );
}

function loadTg(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve();
  return new Promise((ok) => {
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = () => ok();
    s.onerror = () => ok();
    document.head.appendChild(s);
  });
}

/** 18.10.2026, его слово: «листать ленту вправо… неудобно… давай твой вариант посмотрим по группам». Инструменты
 *  плитками с переносом, по группам в порядке боковой панели кабинета (groupRows), сторона — цветом; список
 *  сворачивается кнопкой с выбранным инструментом, чтобы на телефоне не занимал весь экран. */
const PICK_MODE = 'tg_pick_mode';

export function Picker({ rows, cur, onPick }: { rows: MarketRow[]; cur: MarketRow; onPick: (s: string) => void }) {
  const few = rows.length <= 6;
  const [open, setOpen] = useState(false);
  // 18.10.2026, его слово: «в терминале Телеграма, где вкладка инструменты… нету кнопок группы и сценарии. Можешь
  // сделать сортировку по группам и по сценариям?» — те же два вида, что в кабинете; выбор запоминается
  const [mode, setModeState] = useState<'groups' | 'scen'>(() => {
    try {
      return window.localStorage.getItem(PICK_MODE) === 'scen' ? 'scen' : 'groups';
    } catch {
      return 'groups';
    }
  });
  const setMode = (m: 'groups' | 'scen') => {
    setModeState(m);
    try {
      window.localStorage.setItem(PICK_MODE, m);
    } catch {
      /* без памяти браузера — просто не запомним */
    }
  };
  const cap = (t: string) => <div style={{ fontSize: 11, color: DIM, margin: '8px 0 5px', fontFamily: MONO, letterSpacing: '0.06em' }}>{t}</div>;
  // 18.10.2026, его слово: «выделить поводырей… а то они все сливаются в одно» — поводырь своей группы в золотой рамке
  const chip = (x: MarketRow, lead = false) => {
    const on = x.symbol === cur.symbol;
    const col = x.side === 'LONG' ? UP : x.side === 'SHORT' ? DOWN : DIM;
    return (
      <button
        key={x.symbol}
        onClick={() => {
          onPick(x.symbol);
          setOpen(false);
        }}
        style={{ ...pill(on), display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 9px',
                 ...(lead ? { border: `1.5px solid ${ACCENT}`, color: on ? '#0a0a0a' : ACCENT, fontWeight: 700 } : null) }}
      >
        {lead ? <span style={{ fontSize: 10 }}>★</span> : null}
        {x.symbol}
        {x.side ? <span style={{ color: on ? '#0a0a0a' : col, fontSize: 9 }}>{x.side === 'LONG' ? '▲' : '▼'}</span> : null}
      </button>
    );
  };
  if (few) return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 8 }}>{rows.map((x) => chip(x))}</div>;
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)} style={{ ...pill(false), width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 12px', color: FG }}>
        <span>Инструменты · <b style={{ color: ACCENT }}>{cur.symbol}</b></span>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <div style={{ border: `1px solid ${BORDER}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '10px 10px 10px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['groups', 'Группы'], ['scen', 'Сценарии']] as const).map(([k, n]) => (
              <button key={k} onClick={() => setMode(k)} style={{ ...pill(mode === k), flex: 1, padding: '8px 6px' }}>
                {n}
              </button>
            ))}
          </div>
          {mode === 'scen'
            ? scenarioRows(rows, rows)
                .filter((b) => b.rows.length)
                .map((b) => {
                  const numbered = b.key === '1' || b.key === '2';
                  const yes = numbered ? b.rows.filter((x) => x.confirmation) : b.rows;
                  const no = numbered ? b.rows.filter((x) => !x.confirmation) : [];
                  return (
                    <div key={b.key} style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: FG }}>
                        {SCEN_META[b.key].title}
                        <span style={{ color: ACCENT, fontWeight: 400, fontSize: 12 }}> · {b.total}</span>
                      </div>
                      {SCEN_META[b.key].note ? <div style={{ fontSize: 12, color: DIM, lineHeight: 1.35, marginTop: 2 }}>{SCEN_META[b.key].note}</div> : null}
                      {numbered && yes.length ? cap(`с подтверждением · ${yes.length}`) : null}
                      {yes.length ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: numbered ? 0 : 6 }}>{yes.map((x) => chip(x))}</div> : null}
                      {no.length ? cap(`без подтверждения · ${no.length}`) : null}
                      {no.length ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{no.map((x) => chip(x))}</div> : null}
                    </div>
                  );
                })
            : groupRows(rows, rows).map(([g, rs]) => {
            const lead = rs.find((x) => x.extra?.leads === g);
            return (
              <div key={g} style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: FG, marginBottom: 6 }}>
                  {g === 'NONE' ? 'Без поводыря' : `Группа ${GEN[g] || g}`}
                  {lead ? <span style={{ color: ACCENT, fontWeight: 400, fontSize: 12 }}> · поводырь ★ {lead.symbol}</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{rs.map((x) => chip(x, x.extra?.leads === g))}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** 20.10.2026, его «вкладка «Цены» в терминале школьного бота»: подписка и обучение, не выходя из Телеграма.
 *  Цены из lib/prices, те же, что на сайте. VIP здесь с ценой (его «в терминале VIP можно с ценой сделать»).
 *  Оплата у Сергея в личке, туда и кнопка. */
function PricesTab() {
  const head = (t: string) => (
    <div style={{ fontSize: 11, color: ACCENT, fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '16px 0 8px' }}>{t}</div>
  );
  const card = (featured = false): React.CSSProperties => ({ border: `1px solid ${featured ? ACCENT : BORDER}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 });
  const price = (p: string, old?: string, per?: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: FG }}>{p}</span>
      {old ? <span style={{ fontSize: 13, color: DIM, textDecoration: 'line-through' }}>{old}</span> : null}
      {per ? <span style={{ fontSize: 12, color: DIM, fontFamily: MONO }}>{per}</span> : null}
    </div>
  );
  const study: [string, string, { price: string; oldPrice?: string; period: string }][] = [
    ['Trade System', 'Курс TRADE SYSTEM 2.0 и полный алгоритм системы. Проходите сами, в своём темпе.', STUDY_PRICES.tradeSystem],
    ['Практикум', 'Живое занятие раз в неделю, разбор ваших сделок и обратная связь по каждому решению. Набор потоками, от 3 человек.', STUDY_PRICES.practicum],
    ['VIP', 'Все пять этапов обучения и год сопровождения, ECHO-GATE INSIDE на год, индикаторы, скрипты и таблицы системы. Hunter Bot и Risk Sentinel остаются у вас навсегда.', STUDY_PRICES.vip],
  ];
  return (
    <div style={{ lineHeight: 1.5 }}>
      {head('Подписка ECHO-GATE INSIDE')}
      <div style={{ fontSize: 13.5, color: FG, marginBottom: 10 }}>
        Терминал находит сделку, по каждому допуску я даю вердикт. Вы отмечаете точку входа и нажимаете СТАРТ, дальше сделку ведёт советник.
      </div>
      {ECOSYSTEM.map((e) => (
        <div key={e.period} style={card(e.featured)}>
          {price(e.price, e.oldPrice, e.period)}
          {e.tgNote || e.saving ? <div style={{ fontSize: 12.5, color: DIM, marginTop: 4 }}>{[e.tgNote, e.saving].filter(Boolean).join(' ')}</div> : null}
        </div>
      ))}
      <div style={{ fontSize: 12.5, color: DIM, margin: '4px 0 6px' }}>
        Для старта нужны MT4 или MT5 у любого брокера и VPS. После оплаты возврата нет: подписка работает как аренда на срок.
      </div>
      <div style={{ fontSize: 12.5, color: ACCENT }}>
        Торговли без убытков не бывает, и я её не обещаю. Убыточные сделки бывают и подряд, зато риск каждой известен до входа.
      </div>
      {head('Обучение')}
      {study.map(([name, what, p]) => (
        <div key={name} style={card()}>
          <div style={{ fontSize: 15, fontWeight: 700, color: FG, marginBottom: 2 }}>{name}</div>
          {price(p.price, p.oldPrice, p.period)}
          <div style={{ fontSize: 12.5, color: DIM, marginTop: 4 }}>{what}</div>
        </div>
      ))}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <NextBtn label="Подключиться: написать Сергею" url={SERGEY_URL} />
      </div>
    </div>
  );
}

const KINDS: [keyof MarketRow, string][] = [['chart_cycles', 'Сценарий'], ['chart_trend', 'Накопления'], ['chart_all', 'Все циклы']];

export default function TgTerminal() {
  const bot: Bot = useParams().bot === 'school' ? 'school' : 'echo';
  const [d, setD] = useState<TgData | null>(null);
  // 18.10.2026: кнопки цепочки пробы школьного бота открывают нужную вкладку (&tab=dec|tm|tr)
  const [tab, setTab] = useState<Tab>(() => {
    const want = new URLSearchParams(window.location.search).get('tab');
    return TABS[bot].some(([k]) => k === want) ? (want as Tab) : TABS[bot][0][0];
  });
  const [sym, setSym] = useState<string | null>(null);
  const [kind, setKind] = useState<keyof MarketRow>('chart_cycles');
  const fresh = useMemo(() => bot === 'school' && new URLSearchParams(window.location.search).get('n') === '1', [bot]);
  // ⛔ 20.10.2026, его слово: машина времени и тренажёр есть только в пробе школьного бота — из веб-кабинета убраны
  // («Они там не нужны»), в боте экосистемы их нет, в подписку они не входят. Проба кончилась — этих вкладок нет и
  // «доступ после подписки» им не обещаем; до 4 вопросов (fresh) они видны с замком: откроются на 7 дней
  const tabs = useMemo(
    () => TABS[bot].filter(([k]) => !(d?.limited && !fresh && (k === 'tm' || k === 'tr'))),
    [bot, d?.limited, fresh],
  );
  useEffect(() => {
    if (!tabs.some(([k]) => k === tab)) setTab('dec');
  }, [tabs, tab]);

  useEffect(() => {
    let alive = true;
    loadTg().then(async () => {
      const tg = window.Telegram?.WebApp;
      try {
        tg?.ready();
        tg?.expand();
        tg?.setHeaderColor?.(BG);
        tg?.setBackgroundColor?.(BG);
      } catch {
        /* старый клиент Телеграма */
      }
      const init = tg?.initData || '';
      const pass = new URLSearchParams(window.location.search).get('p');
      if (!init) {
        if (alive) setD({ ok: false, reason: 'no_init' });
        return;
      }
      const { data, error } = await (supabase.rpc as unknown as (f: string, a: object) => Promise<{ data: TgData | null; error: unknown }>)(
        'tg_terminal',
        // 18.10.2026: у школьного бота в адресе кнопки — пропуск на его 7 дней (school_bot.terminal_url), база его сверяет
        { init_data: init, bot, ...(pass ? { pass } : {}) },
      );
      // 18.10.2026: «no_init» с непустой подписью — база ещё не знает ключ этого бота (мост не прошёл круг), а не
      // «открыто не из бота»: так и пишем
      const res = error || !data ? { ok: false, reason: 'net' } : data;
      if (alive) setD(res.reason === 'no_init' ? { ...res, reason: 'no_key' } : res);
    });
    return () => {
      alive = false;
    };
  }, [bot]);

  const rows = useMemo(() => d?.rows || [], [d]);
  const symbols = useMemo(() => new Set(rows.map((r) => r.symbol)), [rows]);
  const pub = (p: string) => `${SU}/storage/v1/object/public/tgpub/${d?.pub}/${p}`;
  const view = useMemo(() => ({ still: true, plain: true, scene: (p: string) => `${SU}/storage/v1/object/public/tgpub/${p}`, pic: (p: string) => `${SU}/storage/v1/object/public/tgpub/${d?.pub}/${p}` }), [d?.pub]);
  const open = (s: string) => {
    if (!symbols.has(s)) return;
    setSym(s);
    setTab('inst');
    window.scrollTo(0, 0);
  };

  const shell = (body: React.ReactNode, withTabs = true) => (
    <div style={{ background: BG, color: FG, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Syne', system-ui, sans-serif", maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* 18.10.2026, его слово: «менюшка внизу… чтобы она была всегда внизу, а прокрутка работала мимо неё» — меню
          закреплено (fixed: sticky ломается от overflow-x: hidden у страницы), снизу у содержимого запас под него */}
      <div style={{ flex: 1, padding: 12, minWidth: 0, paddingBottom: withTabs ? 'calc(78px + env(safe-area-inset-bottom))' : 12 }}>{body}</div>
      {withTabs ? (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', background: '#0f0e0d', borderTop: `1px solid ${BORDER}`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {tabs.map(([k, n, i]) => (
            <div key={k} onClick={() => { setTab(k); window.scrollTo(0, 0); }} style={{ flex: 1, textAlign: 'center', padding: '8px 2px 10px', fontSize: 10.5, color: tab === k ? ACCENT : DIM, cursor: 'pointer', fontFamily: MONO }}>
              <div style={{ fontSize: 17 }}>{d?.limited && k !== 'dec' ? '🔒' : i}</div>
              {n}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!d) return shell(<div style={{ color: DIM, padding: 20, textAlign: 'center' }}>Загружаю терминал…</div>, false);
  if (!d.ok) {
    const msg =
      d.reason === 'no_init'
        ? 'Откройте терминал из бота: кнопка «Терминал» внизу чата.'
        : d.reason === 'no_key'
          ? 'Терминал подключается. Откройте его снова через пару минут.'
          : d.reason === 'school_expired'
          ? fresh
            ? `Журнал решений открыт всем. ${AFTER_QUIZ}`
            : 'Журнал решений открыт всем. Полный терминал — доступ после подписки.'
          : d.reason === 'school_pass'
          ? // 18.10.2026 вечер, его слово: «нажимает на кнопку терминал… и вместо терминала написано „откройте терминал кнопкой“ — нелогично».
            // Сюда попадает только старая общая кнопка: терминал в боте — у новых участников, полный — после подписки
            'Терминал обновился. Закройте его и откройте снова кнопкой «Терминал» внизу чата.'
          : d.reason === 'no_access'
          ? 'Терминал в этом боте — для подписчиков ECHO-GATE INSIDE. Подписка не найдена или закончилась. Продлить её можно у Сергея.'
          : 'Не удалось проверить вход. Закройте терминал и откройте его снова из бота.';
    // 19.10.2026, его «все 7 пунктов согласен»: ни один экран не оставляет человека без следующего шага
    const cta: [string, string] =
      d.reason === 'no_init'
        ? ['Открыть бота', BOT_URL]
        : d.reason === 'school_pass' || (d.reason === 'school_expired' && fresh)
          ? ['Ответить на 4 вопроса в боте', BOT_URL]
          : ['Написать Сергею', SERGEY_URL];
    return shell(
      <div style={{ color: FG, padding: 24, textAlign: 'center', lineHeight: 1.6 }}>
        {msg}
        <div style={{ marginTop: 18 }}>
          <NextBtn label={cta[0]} url={cta[1]} />
        </div>
      </div>,
      false,
    );
  }

  const list = rows;
  const r = list.find((x) => x.symbol === sym) || list[0];
  const pic = r ? (r[kind] as string | null) : null;
  const videos = parseJournalVideos(d.videos);

  let body: React.ReactNode = null;
  if (d.limited && tab !== 'dec') {
    // 18.10.2026 вечер, его «согласен»: после 7 дней пробы остаётся журнал решений, остальное — после подписки
    body = (
      <div style={{ color: FG, padding: '32px 16px', textAlign: 'center', lineHeight: 1.6 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        {/* 18.10.2026 вечер, его слово: «мои решения пускай будут для всех… доступ после подписки — вот так лучше написать» */}
        {fresh ? 'Журнал решений открыт всем.' : 'Журнал моих решений открыт всем — вкладка «Решения».'}
        <br />
        {fresh ? AFTER_QUIZ : 'Инструменты — доступ после подписки.'}
        <div style={{ marginTop: 18 }}>
          {fresh ? (
            <NextBtn label="Ответить на 4 вопроса в боте" url={BOT_URL} />
          ) : (
            <NextBtn label="Доступ после подписки — написать Сергею" url={SERGEY_URL} />
          )}
        </div>
      </div>
    );
  } else if (tab === 'inst') {
    body = r ? (
      <div>
        {bot === 'school' ? (
          <div style={{ color: DIM, fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
            {/* 18.10.2026, его слово: «все инструменты в веб-версии» — обман, там у нового человека та же проба; «лучше
                написать: все инструменты после подписки» */}
            Инструменты для примера: так система разбирает рынок — неделя, шаг 1; дневка, шаг 2. Все инструменты — после подписки.{' '}
            <span onClick={() => go(SERGEY_URL)} style={{ color: ACCENT, cursor: 'pointer', textDecoration: 'underline' }}>Написать Сергею</span>
          </div>
        ) : null}
        <Picker rows={list} cur={r} onPick={setSym} />
        <div style={{ fontSize: 20, fontWeight: 700, margin: '6px 0' }}>{r.title || r.symbol}</div>
        <Decision r={r} narrow />
        <div style={{ display: 'flex', gap: 6, margin: '14px 0 8px', flexWrap: 'wrap' }}>
          {KINDS.filter(([k]) => r[k]).map(([k, n]) => (
            <button key={k} onClick={() => setKind(k)} style={pill(kind === k)}>
              {n}
            </button>
          ))}
        </div>
        {pic ? <img src={pub(pic)} alt={r.symbol} style={{ width: '100%', borderRadius: 8, border: `1px solid ${BORDER}` }} /> : null}
      </div>
    ) : (
      <div style={{ color: DIM }}>Инструментов пока нет.</div>
    );
  } else if (tab === 'scr') {
    body = <ScreenerCards doc={d.feeds?.screener} symbols={symbols} onOpen={open} />;
  } else if (tab === 'top') {
    body = <ScreenerCards part="top" doc={d.feeds?.screener} symbols={symbols} onOpen={open} />;
  } else if (tab === 'dec') {
    body = (
      <>
        {bot === 'school' ? (
          <div style={{ color: DIM, fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
            {/* 19.10.2026: в школьном боте решения старше 3 дней (tg_terminal) — человек должен знать, почему нет свежих */}
            Здесь мои решения старше 3 дней. Подписчики получают их сразу, в момент решения.
            {/* 20.10.2026, его «да» (пункт Б): человек попадает сразу сюда и вкладки с замком может не открыть */}
            {fresh && d.limited ? (
              <div style={{ color: FG, marginTop: 6 }}>
                {AFTER_QUIZ}{' '}
                <span onClick={() => go(BOT_URL)} style={{ color: ACCENT, cursor: 'pointer', textDecoration: 'underline' }}>Ответить на вопросы</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <VerdictsFeed doc={d.feeds?.verdicts} outcomes={d.feeds?.outcomes} videos={videos} symbols={symbols} onOpen={open} picUrl={(p) => pub(p)} privateCrypto={d.admin ? d.feeds?.verdicts_crypto || { items: [] } : undefined} />
      </>
    );
  } else if (tab === 'tm') {
    body = <TimeMachine doc={d.feeds?.timemachine} symbols={symbols} onOpen={open} />;
  } else if (tab === 'tr') {
    body = <Trainer doc={d.feeds?.timemachine} symbols={symbols} onOpen={open} />;
  }
  return <TmViewCtx.Provider value={view}>{shell(body)}</TmViewCtx.Provider>;
}
