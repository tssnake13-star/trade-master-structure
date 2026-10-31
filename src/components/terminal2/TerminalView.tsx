import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Room from '@/components/cabinet2/Room';
import TerminalSidebar from '@/components/terminal/Sidebar';
import { TradingStyle } from '@/components/terminal/Decision';
import { FalseExitFeed, TrendFeed, VerdictsFeed, type Verdict } from '@/components/terminal/Feeds';
import { ScreenerCards } from '@/components/terminal/Screener';
import { TimeMachine, type TimeItem } from '@/components/terminal/TimeMachine';
import { HistoryView } from '@/components/terminal/History';
import type { Layer } from '@/components/terminal/scene';
import { DISCLAIMER, marketOfSym } from '@/components/terminal/theme';
import Header from './Header';
import InstrumentStrip from './Instruments';
import { InstrumentMain, InstrumentRight, useInstrumentMedia, type ChartView } from './InstrumentView';
import { TrialBanner, TrialLock } from './Screens';
import { verdictKey } from './derive';
import { ADMIN_ONLY, SECTIONS, type Kind, type Section, type Tab, type TerminalData, type TerminalSource } from './model';
import '@/styles/echo-fx.css';
import '@/styles/cabinet-v2.css';
import '@/styles/terminal-v2.css';

/**
 * Терминал ECHO-GATE INSIDE v2, «в стиле приборов» (29.10.2026). Один экран и для настоящих данных
 * (pages/SchoolTerminal.tsx, база), и для превью без входа (terminal2/Preview.tsx, демо-данные):
 * отличается только источник — data и source.
 *
 * Сверху шапка со вкладками, под ней приборы (решения недели, итог в R, пары в направлении, скринер, данные),
 * ниже — разделы, как раньше: список инструментов слева, раздел посередине, у инструмента панель справа.
 * Раздел при смене вкладки уходит в размытие, новый собирается по частям. Двигается только то, что живёт
 * само по себе (глаз, точка, скан); цифры рынка не двигаются, пока не изменились данные
 * (его правило 25.10.2026: «не имитировать рыночные данные»).
 */

// высота боковой панели с вкладки «Инструмент» (03.10.2026) — чтобы на других вкладках она была той же
const SIDE_H_KEY = 'tm-side-h';
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface TerminalViewProps {
  data: TerminalData;
  source: TerminalSource;
  isAdmin: boolean;
  /** ученик — для «новое в журнале» (journalSeen) */
  seenKey?: string;
  scan?: boolean;
  demo?: boolean;
  /** плашка демо под шапкой (превью) */
  demoBar?: ReactNode;
  onSection?: (s: Section) => void;
  onBack: () => void;
}

export default function TerminalView({ data, source, isAdmin, seenKey, scan = false, demo, demoBar, onSection, onBack }: TerminalViewProps) {
  const { rows, feeds, meta, until, trial, lockedList, hiddenVerdicts, videos } = data;
  const [params, setParams] = useSearchParams();
  const sections = SECTIONS.filter(([s]) => !ADMIN_ONLY.includes(s) || isAdmin);
  const mainSections = sections.filter(([s]) => !ADMIN_ONLY.includes(s));
  const adminSections = sections.filter(([s]) => ADMIN_ONLY.includes(s));
  const selected = params.get('i');
  // 18.10.2026, его слово про пробный режим: «первое это должны быть решения… мои» — пробному без ?s= открывается журнал
  const section = (sections.find(([s]) => s === params.get('s'))?.[0] || (trial ? 'verdicts' : 'instrument')) as Section;
  useEffect(() => {
    onSection?.(section);
  }, [section, onSection]);

  // часы для свежести: раз в минуту
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  const [wide, setWide] = useState(typeof window === 'undefined' ? true : window.innerWidth >= 1100);
  // телефон: кнопки слоёв — под одной «слои», чтобы не занимали полэкрана
  const [phone, setPhone] = useState(typeof window === 'undefined' ? false : window.innerWidth < 700);
  useEffect(() => {
    const onResize = () => {
      setWide(window.innerWidth >= 1100);
      setPhone(window.innerWidth < 700);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('Анализ');
  const [kind, setKind] = useState<Kind>('cycles');
  // 29.09.2026, его слово: «верни по умолчанию живой график в компьютерной версии»; телефон — по меньшей стороне экрана
  const [live, setLive] = useState(() => (typeof window === 'undefined' ? true : Math.min(window.screen.width, window.screen.height) >= 600));
  const [hidden, setHidden] = useState<Set<Layer>>(new Set());
  const [showLayers, setShowLayers] = useState(false);
  const view: ChartView = { kind, setKind, live, setLive, hidden, setHidden, showLayers, setShowLayers };

  // 23.09.2026: увеличенная картинка прокручивается колесом, страница под ней стоит; Esc закрывает
  const [full, setFull] = useState(false);
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

  // 21.10.2026: «Сделки до и после» — лента большая, грузим, когда открыта вкладка, один раз за посещение
  const [tmDoc, setTmDoc] = useState<{ items?: TimeItem[] } | null>(null);
  useEffect(() => {
    if (trial || section !== 'timemachine' || tmDoc) return;
    let alive = true;
    source.timeMachine().then((d) => {
      if (alive) setTmDoc(d);
    });
    return () => {
      alive = false;
    };
  }, [trial, section, tmDoc, source]);

  // ⛔ 03.10.2026, его слово: боковая панель на других вкладках стоит ровно той высоты, что на «Инструменте»
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

  // 25.09.2026: бот пишет решение под именем из MT5 (BTCUSD), строка терминала — по скринеру (BTCUSDT)
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
  const cur = useMemo(() => rows.find((r) => r.symbol === selected) || rows[0] || null, [rows, selected]);

  const go = useCallback(
    (s: Section, sym?: string) => {
      // прочие параметры адреса остаются (у превью — какой доступ показан)
      const next: Record<string, string> = Object.fromEntries([...params].filter(([k]) => k !== 's' && k !== 'i'));
      next.s = s;
      const i = sym || cur?.symbol;
      if (i) next.i = i;
      setParams(next, { replace: s === section });
      window.scrollTo({ top: 0 });
    },
    [cur?.symbol, section, setParams, params],
  );
  const openSymbol = useCallback((sym: string) => go('instrument', rowOf.get(sym) || sym), [go, rowOf]);

  const { pic, scene } = useInstrumentMedia(cur, kind, live, meta?.updated_at, source);

  // все решения журнала: у администратора — и его решения по крипте «только мне» (как в самом журнале)
  const verdicts = useMemo(
    () => [...(feeds.verdicts?.items || []), ...(isAdmin ? feeds.verdicts_crypto?.items || [] : [])],
    [feeds.verdicts, feeds.verdicts_crypto, isAdmin],
  );
  // новое решение пришло, пока экран открыт: прибор вспыхивает, в шапке на 8 с — что пришло
  const seen = useRef<Set<string> | null>(null);
  const [freshTick, setFreshTick] = useState(0);
  const [fresh, setFresh] = useState<Verdict | null>(null);
  useEffect(() => {
    const keys = new Set(verdicts.map(verdictKey));
    if (seen.current) {
      const neu = verdicts.filter((v) => !seen.current?.has(verdictKey(v))).sort((a, b) => b.time.localeCompare(a.time));
      if (neu.length) {
        // 31.10.2026: в приборах только форекс — на решение по крипте прибор не вспыхивает
        if (neu.some((v) => marketOfSym(v.instrument) === 'fx')) setFreshTick((n) => n + 1);
        setFresh(neu[0]);
      }
    }
    seen.current = keys;
  }, [verdicts]);
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => setFresh(null), 8000);
    return () => window.clearTimeout(t);
  }, [fresh]);

  // смена раздела: старый уходит в размытие (0,2 с), новый собирается по частям
  const [shown, setShown] = useState<Section>(section);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (section === shown) return;
    if (reduceMotion()) {
      setShown(section);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShown(section);
      setLeaving(false);
    }, 200);
    return () => window.clearTimeout(t);
  }, [section, shown]);

  useEffect(() => {
    const el = sideEl;
    if (!wide || shown !== 'instrument' || !el) return;
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
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wide, shown, sideEl]);

  // 07.10.2026: сколько дней пробного доступа осталось — для плашки сверху
  const trialDays = trial && until ? Math.max(1, Math.ceil((new Date(until).getTime() - now) / 86400000)) : 0;

  const sidebar = (
    <TerminalSidebar
      rows={rows}
      list={list}
      query={query}
      onQuery={setQuery}
      selected={shown === 'instrument' ? cur?.symbol || null : null}
      onOpen={openSymbol}
      wide={wide}
      trial={trial}
      pricesAt={meta?.updated_at || null}
    />
  );
  // общие ленты (скринер, журнал, сделки) — со своими карточками, без рамки вокруг; своё — в стеклянной панели
  const panel = (i: number, node: ReactNode, cls = 'tv2-feed') => (
    <div className={`tv2-panel tv2-in ${cls}`} style={{ '--i': i } as CSSProperties}>
      {node}
    </div>
  );
  const right = cur ? <InstrumentRight cur={cur} isAdmin={isAdmin} history={feeds.history} tab={tab} setTab={setTab} /> : null;

  let body: ReactNode = null;
  if (shown === 'instrument')
    body = cur ? (
      <>
        <InstrumentMain cur={cur} phone={phone} view={view} pic={pic} scene={scene} onZoom={() => setFull(true)} demo={demo} />
        {!wide && right ? <div style={{ marginTop: 14 }}>{right}</div> : null}
      </>
    ) : (
      panel(0, <div className="tv2-empty">Инструментов пока нет.</div>, '')
    );
  else if (shown === 'screener') body = trial ? <TrialLock what="Скринер" /> : panel(0, <ScreenerCards doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />);
  else if (shown === 'top') body = trial ? <TrialLock what="ТОП-лист" /> : panel(0, <ScreenerCards part="top" doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />);
  else if (shown === 'trend' && isAdmin) body = panel(0, <TrendFeed doc={feeds.trend} symbols={symbols} onOpen={openSymbol} />);
  else if (shown === 'falsex' && isAdmin) body = panel(0, <FalseExitFeed doc={feeds.falsex} symbols={symbols} onOpen={openSymbol} />);
  else if (shown === 'verdicts')
    body = (
      <>
        {trial && hiddenVerdicts.length
          ? panel(
              0,
              <div className="tv2-note-row">
                <Lock size={13} />
                <span>
                  Решений за последние 3 дня: {hiddenVerdicts.length}. В пробном доступе они открываются через 3 дня после
                  публикации, у подписчиков приходят сразу.
                </span>
              </div>,
              'tv2-note',
            )
          : null}
        {panel(
          1,
          <VerdictsFeed
            doc={feeds.verdicts}
            outcomes={feeds.outcomes}
            videos={videos}
            symbols={symbols}
            onOpen={openSymbol}
            picUrl={source.picUrl}
            privateCrypto={isAdmin ? feeds.verdicts_crypto || { items: [] } : undefined}
            seenKey={seenKey}
            fx
          />,
        )}
      </>
    );
  else if (shown === 'timemachine')
    body = trial ? (
      <TrialLock what="Сделки до и после" />
    ) : tmDoc ? (
      panel(0, <TimeMachine doc={tmDoc} symbols={symbols} onOpen={openSymbol} />)
    ) : (
      panel(0, <div className="tv2-empty">Загружаю сделки до и после…</div>, '')
    );
  else if (shown === 'history' && isAdmin) body = panel(0, <HistoryView doc={feeds.history} order={rows.map((r) => r.symbol)} symbols={symbols} onOpen={openSymbol} />);

  return (
    <div className="cv2 tv2">
      <Room />
      {/* 25.10.2026, «скан»: после запуска черта открывает окно сверху вниз */}
      {scan ? <div className="tm-scan" aria-hidden="true" /> : null}
      <div className="cv2-page tv2-page">
        <div className="tv2-wrap">
          <Header
            main={mainSections}
            admin={adminSections}
            section={section}
            onSection={(s) => go(s)}
            trial={trial}
            trialOpen={data.trialOpen}
            until={until}
            updatedAt={meta?.updated_at || null}
            now={now}
            scan={scan}
            fresh={fresh}
            onFresh={() => go('verdicts')}
            demo={demo}
            onBack={onBack}
          />
          {demoBar}
          {trial ? <TrialBanner days={trialDays} open={rows.map((r) => r.symbol)} locked={lockedList} /> : null}
          <InstrumentStrip
            aside={<TradingStyle />}
            data={data}
            verdicts={verdicts}
            now={now}
            demo={demo}
            freshTick={freshTick}
            onOpenSymbol={openSymbol}
            onSection={(s) => go(s)}
          />
          <div className={`tv2-main${wide ? (shown === 'instrument' ? ' w3' : ' w2') : ''}`}>
            {/* ⛔ 03.10.2026, его слово: «список заканчивался вместе с графиком… если не помещается — прокрутка» */}
            {wide ? (
              <div
                ref={setSideEl}
                className="tv2-side"
                style={
                  shown === 'instrument' || !sideH
                    ? { position: 'relative', minHeight: 520 }
                    : { position: 'relative', height: Math.max(520, sideH), alignSelf: 'start' }
                }
              >
                <div style={{ position: 'absolute', inset: 0 }}>{sidebar}</div>
              </div>
            ) : (
              <div className="tv2-side">{sidebar}</div>
            )}
            <div key={shown} className={leaving ? 'cv2-view out tv2-sec' : 'cv2-view tv2-sec'}>
              {body}
              <div className="tv2-disclaimer">{DISCLAIMER}</div>
            </div>
            {wide && shown === 'instrument' && right ? <div className={leaving ? 'cv2-view out' : 'cv2-view'}>{right}</div> : null}
          </div>
        </div>
      </div>

      {full && pic ? (
        // 23.09.2026: картинка во всю ширину (не больше своего размера), слой прокручивается колесом
        <div className="tv2-zoom" onClick={() => setFull(false)}>
          <img src={pic} alt={cur?.symbol || ''} />
        </div>
      ) : null}
    </div>
  );
}
