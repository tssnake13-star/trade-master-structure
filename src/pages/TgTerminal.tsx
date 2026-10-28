import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ACCENT, BG, BORDER, DIM, FG, MONO, pill } from '@/components/terminal/theme';
import { Decision } from '@/components/terminal/Decision';
import { Beam, type MarketRow } from '@/components/terminal/parts';
import Boot, { type BootSteps } from '@/components/terminal/Boot';
import '@/styles/echo-fx.css';
import { VerdictsFeed, type FeedDocs } from '@/components/terminal/Feeds';
import { ScreenerCards } from '@/components/terminal/Screener';
import { TimeMachine, TmViewCtx, type TimeItem } from '@/components/terminal/TimeMachine';
import { parseJournalVideos } from '@/lib/journalVideos';
import { SCEN_META, groupRows, scenarioRows } from '@/components/terminal/sidebarRows';
import { GEN } from '@/components/terminal/screenerParse';
import { UP, DOWN } from '@/components/terminal/theme';
import { ECOSYSTEM, STUDY_PRICES } from '@/lib/prices';
import { AUTHOR_STATS } from '@/lib/authorStats';
import { STUDENT_CASES } from '@/lib/testimonials';
import { PURCHASE_FAQ } from '@/lib/purchaseFaq';

/**
 * 18.10.2026, его слово «Все, давай внедряй»: терминал внутри Телеграма — кнопка «Терминал» в меню бота.
 *  /tg/echo   — бот Echo-Gate, подписчики: Инструмент · Скринер · ТОП-лист · Решения;
 *  /tg/school — школьный бот, холодные: Решения · Инструмент (инструменты пробы) · Сделки до и после · Цены
 *  (21.10.2026, его слово: «переименуй машину времени в сделки до и после»)
 *  (20.10.2026: цены подписки и обучения, не выходя из Телеграма; открыты всем). ⛔ 20.10.2026 вечер, его слово «Убери
 *  из школьного бота в терминале тренажёр» — вкладки «Тренажёр» нет (из веб-кабинета она ушла в тот же день, раньше).
 * Его слово: «графики должны быть статичные, как в боте» — картинки бота, в машине времени рисунок бота без
 * масштаба и сдвига. Кто открыл, проверяет база (tg_terminal) по подписи Телеграма; без подписки — экран-объяснение.
 */

type Bot = 'echo' | 'school';
type Tab = 'inst' | 'scr' | 'top' | 'dec' | 'tm' | 'price';
const TABS: Record<Bot, [Tab, string, string][]> = {
  echo: [['inst', 'Инструмент', '📈'], ['scr', 'Скринер', '🔎'], ['top', 'ТОП-лист', '🏆'], ['dec', 'Решения', '📋']],
  // 20.10.2026, его «вкладка «Цены» в терминале школьного бота, кнопки «Все цены» ведут в неё» (&tab=price)
  school: [['dec', 'Решения', '📋'], ['inst', 'Инструмент', '📈'], ['tm', 'Сделки до и после', '🕰'], ['price', 'Стоимость', '🏷']],
};
// вкладки, открытые и после пробы, и до вопросов: журнал решений и цены
const ALWAYS_OPEN: Tab[] = ['dec', 'price'];
// строки запуска (Boot): терминал в боте грузится одним запросом по подписи Телеграма — свои шаги
const BOOT_LINES: [keyof BootSteps, string][] = [
  ['access', 'вход через Telegram'],
  ['market', 'проверка доступа'],
  ['feeds', 'рынок и журнал решений'],
];
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
const SITE_URL = 'https://www.tradeliketyo.com/';
// 20.10.2026, разбор воронки, пункт 5: бот ставит метку n=1 тому, кто ещё не ответил на 4 вопроса. Ему открыт журнал,
// остальное откроется после вопросов. Метка только для текста, доступ решает база по пропуску
const AFTER_QUIZ = 'Проверка сделки, инструменты и «Сделки до и после» откроются на 7 дней после 4 коротких вопросов в боте.';

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
        className={on ? 'tm-sel' : undefined}
        style={{ ...pill(on), display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 9px',
                 ...(lead ? { border: `1.5px solid ${ACCENT}`, color: on ? '#0a0a0a' : ACCENT, fontWeight: 700 } : null) }}
      >
        {lead ? <span style={{ fontSize: 10 }}>★</span> : null}
        {x.symbol}
        {x.side ? <span style={{ color: on ? '#0a0a0a' : col, fontSize: 9 }}>{x.side === 'LONG' ? '▲' : '▼'}</span> : null}
        {/* 25.10.2026, его «да» на список из веб-версии: по выбранному бежит луч, как в кабинете */}
        {on ? <Beam phase={0.6} /> : null}
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
              <button key={k} onClick={() => setMode(k)} className={mode === k ? 'tm-sel' : undefined} style={{ ...pill(mode === k), flex: 1, padding: '8px 6px' }}>
                {n}
                {mode === k ? <Beam phase={2.0} /> : null}
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
 *  Оплата у Сергея в личке, туда и кнопка.
 *  20.10.2026 вечер, его «Да, делай так, покажи сначала»: лендинг целиком сюда не ставим (его кнопки ведут в этого же
 *  бота, длинная страница в Телеграме грузится долго), а берём три блока сайта теми же словами: над ценами — автор
 *  (AuthorSection, цифры lib/authorStats) и отзывы учеников (lib/testimonials, с оговоркой), после цен — вопросы перед
 *  оплатой (lib/purchaseFaq, его порядок); внизу ссылка на полный сайт — откроется в браузере. */
function PricesTab() {
  const [orig, setOrig] = useState<string | null>(null);        // оригинал отзыва из Телеграма — на весь экран
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
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
  // 25.10.2026, его слово: «выделить годовую подписку и практикум… как на сайте» — на сайте практикум подсвечен лучом
  // (PackageCards, featured); здесь у него та же золотая рамка и луч, что у годовой подписки
  const study: [string, string, { price: string; oldPrice?: string; period: string }, boolean?][] = [
    ['Trade System', 'Видеообучение TRADE SYSTEM 2.0 и полный алгоритм системы. Проходите сами, в своём темпе.', STUDY_PRICES.tradeSystem],
    ['Практикум', 'Живое занятие раз в неделю, разбор ваших сделок и обратная связь по каждому решению. Набор потоками, от 3 человек.', STUDY_PRICES.practicum, true],
    ['VIP', 'Все пять этапов обучения и год сопровождения, ECHO-GATE INSIDE на год, индикаторы, скрипты и таблицы системы. Hunter_Bot и Risk Sentinel остаются у вас навсегда.', STUDY_PRICES.vip],
  ];
  // луч по рамке выделенной карточки — медленный, как на карточках сайта; у двух карточек разные фазы
  const beam = (on: boolean, phase: number) => (on ? <Beam fit="in" period={8} phase={phase} /> : null);
  return (
    <div style={{ lineHeight: 1.5 }}>
      {/* автор — блок «Автор» сайта, теми же словами, коротко */}
      {head('Автор')}
      <div style={card()}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src="/author-sergey-te.jpg" alt="Сергей Тё" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: FG }}>Сергей Тё</div>
            <div style={{ fontSize: 12.5, color: DIM }}>Архитектор торговых систем</div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: FG, marginTop: 10 }}>
          15 лет в рынке. Торгую по той же системе, которую даю вам попробовать.
        </div>
        <div style={{ fontSize: 13.5, color: FG, marginTop: 8 }}>
          Мои лучшие сделки — те, которые я <span style={{ color: ACCENT }}>не совершил</span>
        </div>
        <div style={{ fontSize: 13, color: DIM }}>Поэтому я не учу угадывать входы</div>
        <div style={{ fontSize: 13.5, color: FG }}>Я выстраиваю систему, которая принимает решение</div>
        <div style={{ fontSize: 13, color: DIM }}>Где вы перестаёте действовать на ощущениях</div>
        <div style={{ fontSize: 10, color: ACCENT, fontFamily: MONO, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>
          Практикующий трейдер · не сигнальщик, не инфобизнесмен
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          {AUTHOR_STATS.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 20, fontWeight: 700, color: FG }}>{s.value.toFixed(s.decimals || 0).replace('.', ',')}{s.suffix}</div>
              <div style={{ fontSize: 11.5, color: DIM }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* отзывы — те же выдержки, что на сайте («04 · Отзывы»), по нажатию оригинал из Телеграма */}
      {head('Отзывы учеников')}
      <div style={{ fontSize: 15, fontWeight: 700, color: FG }}>Знания у них уже были. Не хватало системы.</div>
      <div style={{ fontSize: 12.5, color: DIM, marginTop: 4 }}>
        Отзывы без редактуры: в карточке выдержка, по нажатию открывается оригинал из Telegram.
      </div>
      <div style={{ fontSize: 12.5, color: ACCENT, margin: '4px 0 8px' }}>
        Это результаты учеников, а не обещание: у кого-то получается и так, всё зависит от человека.
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -12px', padding: '0 12px 6px' }}>
        {STUDENT_CASES.map((c) => (
          <div
            key={c.image}
            onClick={() => setOrig(c.image)}
            style={{ ...card(), marginBottom: 0, flex: '0 0 80%', scrollSnapAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 700, color: FG }}>{c.name}</div>
            <div style={{ fontSize: 12, color: DIM, margin: '4px 0 6px' }}>{c.before}</div>
            <div style={{ fontSize: 13.5, color: FG, flex: 1 }}>«{c.quote}»</div>
            <div style={{ fontSize: 12, color: '#2AABEE', marginTop: 8, textAlign: 'right' }}>оригинал →</div>
          </div>
        ))}
      </div>
      {orig ? (
        <div
          onClick={() => setOrig(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <img src={orig} alt="Оригинал отзыва" style={{ maxWidth: '100%', maxHeight: '82vh', borderRadius: 8 }} />
          <div style={{ color: DIM, fontSize: 12.5, marginTop: 10 }}>Нажмите, чтобы закрыть</div>
        </div>
      ) : null}

      {head('Подписка ECHO-GATE INSIDE')}
      <div style={{ fontSize: 13.5, color: FG, marginBottom: 10 }}>
        Терминал находит сделку, по каждому допуску я даю вердикт. Вы отмечаете точку входа и нажимаете СТАРТ, дальше сделку ведёт советник.
      </div>
      {ECOSYSTEM.map((e) => (
        <div key={e.period} className={e.featured ? 'tm-sel' : undefined} style={card(e.featured)}>
          {price(e.price, e.oldPrice, e.period)}
          {e.tgNote || e.saving ? <div style={{ fontSize: 12.5, color: DIM, marginTop: 4 }}>{[e.tgNote, e.saving].filter(Boolean).join(' ')}</div> : null}
          {beam(e.featured, 0)}
        </div>
      ))}
      <div style={{ fontSize: 12.5, color: DIM, margin: '4px 0 6px' }}>
        Для старта нужны MT4 или MT5 у любого брокера и VPS. После оплаты возврата нет: подписка работает как аренда на срок.
      </div>
      <div style={{ fontSize: 12.5, color: ACCENT }}>
        Торговли без убытков не бывает, и я её не обещаю. Убыточные сделки бывают и подряд, зато риск каждой известен до входа.
      </div>
      {head('Обучение')}
      {study.map(([name, what, p, hot]) => (
        <div key={name} className={hot ? 'tm-sel' : undefined} style={card(hot)}>
          <div style={{ fontSize: 15, fontWeight: 700, color: FG, marginBottom: 2 }}>{name}</div>
          {price(p.price, p.oldPrice, p.period)}
          <div style={{ fontSize: 12.5, color: DIM, marginTop: 4 }}>{what}</div>
          {beam(!!hot, 4)}
        </div>
      ))}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <NextBtn label="Подключиться: написать Сергею" url={SERGEY_URL} />
      </div>

      {/* вопросы перед оплатой — тот же список и порядок, что на странице цен сайта */}
      {head('Перед оплатой')}
      <div style={{ fontSize: 15, fontWeight: 700, color: FG, marginBottom: 2 }}>Вопросы, которые стоит задать</div>
      {PURCHASE_FAQ.map((it, i) => (
        <div key={it.q} style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div
            onClick={() => setFaqOpen(faqOpen === i ? null : i)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 0', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 13.5, color: FG }}>{it.q}</span>
            <span style={{ color: ACCENT, fontSize: 18, lineHeight: 1, flexShrink: 0, transform: faqOpen === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>+</span>
          </div>
          {faqOpen === i ? <div style={{ fontSize: 13, color: DIM, paddingBottom: 12 }}>{it.a}</div> : null}
        </div>
      ))}
      <div style={{ fontSize: 13, color: DIM, marginTop: 12 }}>
        Остался вопрос?{' '}
        <span onClick={() => go(SERGEY_URL)} style={{ color: ACCENT, textDecoration: 'underline', cursor: 'pointer' }}>Напишите Сергею</span>
        {' '}— без звонков, всё в Telegram.
      </div>
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <span onClick={() => go(SITE_URL)} style={{ fontSize: 13, color: DIM, textDecoration: 'underline', cursor: 'pointer' }}>
          Полная страница сайта ↗
        </span>
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
  // 25.10.2026, его «да» на список из веб-версии: пока терминал грузится — запуск с глазом, строки загораются по настоящим
  // шагам (Telegram отдал подпись, база проверила вход и прислала данные), без искусственной паузы; потом скан открывает окно
  const [boot, setBoot] = useState<BootSteps>({ access: false, market: false, feeds: false });
  const [scan, setScan] = useState(false);
  const fresh = useMemo(() => bot === 'school' && new URLSearchParams(window.location.search).get('n') === '1', [bot]);
  // 20.10.2026 машина времени была только в пробе, и после пробы её вкладку прятали. ⛔ 21.10.2026, его слово «Верни
  // машину времени в веб-версию… переименуй в сделки до и после»: «Сделки до и после» снова в подписке (веб-кабинет) —
  // после пробы вкладка снова с замком «доступ после подписки». Тренажёра нет совсем (его слово вечером 20.10.2026)
  const tabs = TABS[bot];
  const tabIdx = tabs.findIndex(([k]) => k === tab);
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
      if (alive) setBoot((s) => ({ ...s, access: true }));
      const { data, error } = await (supabase.rpc as unknown as (f: string, a: object) => Promise<{ data: TgData | null; error: unknown }>)(
        'tg_terminal',
        // 18.10.2026: у школьного бота в адресе кнопки — пропуск на его 7 дней (school_bot.terminal_url), база его сверяет
        { init_data: init, bot, ...(pass ? { pass } : {}) },
      );
      // 18.10.2026: «no_init» с непустой подписью — база ещё не знает ключ этого бота (мост не прошёл круг), а не
      // «открыто не из бота»: так и пишем
      const res = error || !data ? { ok: false, reason: 'net' } : data;
      if (!alive) return;
      setBoot({ access: true, market: true, feeds: !!res.ok });
      setD(res.reason === 'no_init' ? { ...res, reason: 'no_key' } : res);
      if (res.ok && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setScan(true);
    });
    return () => {
      alive = false;
    };
  }, [bot]);
  // скан идёт 1,5 с и убирается
  useEffect(() => {
    if (!scan) return;
    const t = window.setTimeout(() => setScan(false), 1600);
    return () => window.clearTimeout(t);
  }, [scan]);

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
          {/* 25.10.2026: под выбранной вкладкой светящаяся полоска с бегущим бликом (echo-fx.css, .tg-tab-ind) */}
          {tabIdx >= 0 ? (
            <span className="tg-tab-ind" aria-hidden="true" style={{ width: `${100 / tabs.length}%`, transform: `translateX(${tabIdx * 100}%)` }} />
          ) : null}
          {tabs.map(([k, n, i]) => (
            <div key={k} onClick={() => { setTab(k); window.scrollTo(0, 0); }} style={{ flex: 1, textAlign: 'center', padding: '8px 2px 10px', fontSize: tabs.length > 4 ? 10 : 10.5, lineHeight: 1.2, color: tab === k ? ACCENT : DIM, cursor: 'pointer', fontFamily: MONO }}>
              <div style={{ fontSize: 17 }}>{d?.limited && !ALWAYS_OPEN.includes(k) ? '🔒' : i}</div>
              {n}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!d) return <Boot steps={boot} lines={BOOT_LINES} />;
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
  if (d.limited && !ALWAYS_OPEN.includes(tab)) {
    // 18.10.2026 вечер, его «согласен»: после 7 дней пробы остаётся журнал решений, остальное — после подписки
    body = (
      <div style={{ color: FG, padding: '32px 16px', textAlign: 'center', lineHeight: 1.6 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        {/* 18.10.2026 вечер, его слово: «мои решения пускай будут для всех… доступ после подписки — вот так лучше написать» */}
        {fresh ? 'Журнал решений открыт всем.' : 'Журнал моих решений открыт всем — вкладка «Решения».'}
        <br />
        {fresh ? AFTER_QUIZ : 'Инструменты и «Сделки до и после» — доступ после подписки.'}
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
            <button key={k} onClick={() => setKind(k)} className={kind === k ? 'tm-sel' : undefined} style={pill(kind === k)}>
              {n}
              {kind === k ? <Beam phase={1.4} /> : null}
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
        {/* 25.10.2026: как в кабинете — новые с прошлого захода решения с меткой «новое», плашки допуска и отказа
            ставятся штампом (fx); что человек уже видел, помнит этот телефон, отдельно для каждого бота */}
        <VerdictsFeed doc={d.feeds?.verdicts} outcomes={d.feeds?.outcomes} videos={videos} symbols={symbols} onOpen={open} picUrl={(p) => pub(p)} privateCrypto={d.admin ? d.feeds?.verdicts_crypto || { items: [] } : undefined} seenKey={`tg-${bot}`} fx />
      </>
    );
  } else if (tab === 'tm') {
    body = <TimeMachine doc={d.feeds?.timemachine} symbols={symbols} onOpen={open} />;
  } else if (tab === 'price') {
    body = <PricesTab />;
  }
  return (
    <TmViewCtx.Provider value={view}>
      {/* 25.10.2026: раздел проявляется при переключении вкладки; после запуска скан открывает окно сверху вниз */}
      {shell(<div key={tab} className="tm-sec">{body}</div>)}
      {scan ? <div className="tm-scan" aria-hidden="true" /> : null}
    </TmViewCtx.Provider>
  );
}
