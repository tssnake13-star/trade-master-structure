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
import { groupRows } from '@/components/terminal/sidebarRows';
import { GEN } from '@/components/terminal/screenerParse';
import { UP, DOWN } from '@/components/terminal/theme';

/**
 * 18.10.2026, его слово «Все, давай внедряй»: терминал внутри Телеграма — кнопка «Терминал» в меню бота.
 *  /tg/echo   — бот Echo-Gate, подписчики: Инструмент · Скринер · ТОП-лист · Решения;
 *  /tg/school — школьный бот, холодные: Решения · Инструмент (инструменты пробы) · Машина времени · Тренажёр.
 * Его слово: «графики должны быть статичные, как в боте» — картинки бота, в машине времени рисунок бота без
 * масштаба и сдвига. Кто открыл, проверяет база (tg_terminal) по подписи Телеграма; без подписки — экран-объяснение.
 */

type Bot = 'echo' | 'school';
type Tab = 'inst' | 'scr' | 'top' | 'dec' | 'tm' | 'tr';
const TABS: Record<Bot, [Tab, string, string][]> = {
  echo: [['inst', 'Инструмент', '📈'], ['scr', 'Скринер', '🔎'], ['top', 'ТОП-лист', '🏆'], ['dec', 'Решения', '📋']],
  school: [['dec', 'Решения', '📋'], ['inst', 'Инструмент', '📈'], ['tm', 'Машина времени', '🕰'], ['tr', 'Тренажёр', '🎯']],
};
const SU = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const WEB = 'https://www.tradeliketyo.com/school';

interface TgData {
  ok: boolean;
  reason?: string;
  pub?: string | null;
  rows?: MarketRow[];
  feeds?: FeedDocs & { timemachine?: { items?: TimeItem[] } };
  videos?: string | null;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; openLink?: (u: string) => void; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } };
  }
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
export function Picker({ rows, cur, onPick }: { rows: MarketRow[]; cur: MarketRow; onPick: (s: string) => void }) {
  const few = rows.length <= 6;
  const [open, setOpen] = useState(false);
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
        <div style={{ border: `1px solid ${BORDER}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '6px 10px 10px' }}>
          {groupRows(rows, rows).map(([g, rs]) => {
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

const KINDS: [keyof MarketRow, string][] = [['chart_cycles', 'Сценарий'], ['chart_trend', 'Накопления'], ['chart_all', 'Все циклы']];

export default function TgTerminal() {
  const bot: Bot = useParams().bot === 'school' ? 'school' : 'echo';
  const [d, setD] = useState<TgData | null>(null);
  const [tab, setTab] = useState<Tab>(TABS[bot][0][0]);
  const [sym, setSym] = useState<string | null>(null);
  const [kind, setKind] = useState<keyof MarketRow>('chart_cycles');

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
      if (!init) {
        if (alive) setD({ ok: false, reason: 'no_init' });
        return;
      }
      const { data, error } = await (supabase.rpc as unknown as (f: string, a: object) => Promise<{ data: TgData | null; error: unknown }>)(
        'tg_terminal',
        { init_data: init, bot },
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
  const view = useMemo(() => ({ still: true, scene: (p: string) => `${SU}/storage/v1/object/public/tgpub/${p}`, pic: (p: string) => `${SU}/storage/v1/object/public/tgpub/${d?.pub}/${p}` }), [d?.pub]);
  const open = (s: string) => {
    if (!symbols.has(s)) return;
    setSym(s);
    setTab('inst');
    window.scrollTo(0, 0);
  };
  const openWeb = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(WEB);
    else window.open(WEB, '_blank');
  };

  const shell = (body: React.ReactNode, withTabs = true) => (
    <div style={{ background: BG, color: FG, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Syne', system-ui, sans-serif", maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ flex: 1, padding: 12, minWidth: 0 }}>{body}</div>
      {withTabs ? (
        <div style={{ position: 'sticky', bottom: 0, display: 'flex', background: '#0f0e0d', borderTop: `1px solid ${BORDER}` }}>
          {TABS[bot].map(([k, n, i]) => (
            <div key={k} onClick={() => { setTab(k); window.scrollTo(0, 0); }} style={{ flex: 1, textAlign: 'center', padding: '8px 2px 10px', fontSize: 10.5, color: tab === k ? ACCENT : DIM, cursor: 'pointer', fontFamily: MONO }}>
              <div style={{ fontSize: 17 }}>{i}</div>
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
          : d.reason === 'no_access'
          ? 'Терминал в этом боте — для подписчиков сигналов. Подписка не найдена или закончилась. Продлить её можно у Сергея.'
          : 'Не удалось проверить вход. Закройте терминал и откройте его снова из бота.';
    return shell(<div style={{ color: FG, padding: 24, textAlign: 'center', lineHeight: 1.6 }}>{msg}</div>, false);
  }

  const list = rows;
  const r = list.find((x) => x.symbol === sym) || list[0];
  const pic = r ? (r[kind] as string | null) : null;
  const videos = parseJournalVideos(d.videos);

  let body: React.ReactNode = null;
  if (tab === 'inst') {
    body = r ? (
      <div>
        {bot === 'school' ? (
          <div style={{ color: DIM, fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
            Инструменты для примера: так система разбирает рынок — неделя, шаг 1; дневка, шаг 2. Все инструменты — в{' '}
            <span onClick={openWeb} style={{ color: ACCENT, textDecoration: 'underline', cursor: 'pointer' }}>веб-версии терминала</span>.
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
    body = <VerdictsFeed doc={d.feeds?.verdicts} outcomes={d.feeds?.outcomes} videos={videos} symbols={symbols} onOpen={open} picUrl={(p) => pub(p)} />;
  } else if (tab === 'tm') {
    body = <TimeMachine doc={d.feeds?.timemachine} symbols={symbols} onOpen={open} />;
  } else if (tab === 'tr') {
    body = <Trainer doc={d.feeds?.timemachine} symbols={symbols} onOpen={open} />;
  }
  return <TmViewCtx.Provider value={view}>{shell(body)}</TmViewCtx.Provider>;
}
