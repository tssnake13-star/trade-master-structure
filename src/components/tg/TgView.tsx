import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ChartCandlestick, ClipboardList, History, Lock, ScanSearch, Tag, Trophy, type LucideIcon } from 'lucide-react';
import Room from '@/components/cabinet2/Room';
import DropGroup from '@/components/cabinet2/DropGroup';
import { BrandEye } from '@/components/terminal2/Screens';
import { Decision } from '@/components/terminal/Decision';
import type { MarketRow } from '@/components/terminal/parts';
import Boot, { type BootSteps } from '@/components/terminal/Boot';
import { VerdictsFeed } from '@/components/terminal/Feeds';
import { ScreenerCards } from '@/components/terminal/Screener';
import { TimeMachine, TmViewCtx } from '@/components/terminal/TimeMachine';
import { parseJournalVideos } from '@/lib/journalVideos';
import TgPicker from './TgPicker';
import TgPrices from './TgPrices';
import { AFTER_QUIZ, ALWAYS_OPEN, BOOT_LINES, BOT_URL, NextBtn, PC_NOTE, SERGEY_URL, TABS, go, type Bot, type Tab, type TgData } from './tgCommon';
import '@/styles/echo-fx.css';
import '@/styles/cabinet-v2.css';
import '@/styles/terminal-v2.css';
import '@/styles/tg-v2.css';

/**
 * Экран терминала в Телеграме — для настоящих данных (pages/TgTerminal.tsx, база по подписи Телеграма) и для демо
 * без Телеграма (TgPreview.tsx). Что показать, решает только d: вкладки, замки, тексты и экраны без доступа прежние.
 *
 * 29.10.2026: ночной облик веб-терминала v2, который Сергей принял: комната за стеклом, латунь — действие и выбор,
 * зелёный — «Допуск», сталь — «Отказ», Geologica и IBM Plex Mono. Общие части терминала (Decision, журнал, скринер,
 * «Сделки до и после») красит terminal-v2.css внутри .tv2, своё — tg-v2.css внутри .tgv2. Нижнее меню по-прежнему
 * закреплено внизу (его требование 18.10.2026), выбранная вкладка — латунная пилюля с лучом по рамке, без бегущих бликов.
 */

const ICON: Record<Tab, LucideIcon> = { inst: ChartCandlestick, scr: ScanSearch, top: Trophy, dec: ClipboardList, tm: History, price: Tag };
const KINDS: [keyof MarketRow, string][] = [['chart_cycles', 'Сценарий'], ['chart_trend', 'Накопления'], ['chart_all', 'Все циклы']];

/** Запуск, пока Телеграм отдаёт подпись и база проверяет вход: тот же экран, что у веб-терминала v2, свои строки */
export function TgBoot({ steps }: { steps: BootSteps }) {
  return (
    <div className="cv2 tv2 tv2-boot tgv2">
      <Room />
      <Boot steps={steps} lines={BOOT_LINES} />
    </div>
  );
}

export interface TgViewProps {
  bot: Bot;
  d: TgData;
  /** школьный бот, ещё не ответил на 4 вопроса (метка n=1 в адресе кнопки) — только для текста */
  fresh: boolean;
  scan?: boolean;
  /** путь картинки бота → адрес: настоящий терминал — открытый ящик tgpub, демо — заглушка */
  pubUrl: (p: string) => string;
  /** путь рисунка «Сделок до и после» → адрес */
  sceneUrl: (p: string) => string;
  /** плашка демо над содержимым (превью) */
  demoBar?: ReactNode;
}

export default function TgView({ bot, d, fresh, scan = false, pubUrl, sceneUrl, demoBar }: TgViewProps) {
  // 18.10.2026: кнопки цепочки пробы школьного бота открывают нужную вкладку (&tab=dec|tm|tr)
  const [tab, setTab] = useState<Tab>(() => {
    const want = new URLSearchParams(window.location.search).get('tab');
    return TABS[bot].some(([k]) => k === want) ? (want as Tab) : TABS[bot][0][0];
  });
  const [sym, setSym] = useState<string | null>(null);
  const [kind, setKind] = useState<keyof MarketRow>('chart_cycles');
  // 20.10.2026 машина времени была только в пробе, и после пробы её вкладку прятали. ⛔ 21.10.2026, его слово «Верни
  // машину времени в веб-версию… переименуй в сделки до и после»: «Сделки до и после» снова в подписке (веб-кабинет) —
  // после пробы вкладка снова с замком «доступ после подписки». Тренажёра нет совсем (его слово вечером 20.10.2026)
  const tabs = TABS[bot];
  const tabIdx = tabs.findIndex(([k]) => k === tab);
  useEffect(() => {
    if (!tabs.some(([k]) => k === tab)) setTab('dec');
  }, [tabs, tab]);

  const rows = useMemo(() => d.rows || [], [d]);
  const symbols = useMemo(() => new Set(rows.map((r) => r.symbol)), [rows]);
  const view = useMemo(() => ({ still: true, plain: true, scene: sceneUrl, pic: pubUrl }), [sceneUrl, pubUrl]);
  const open = (s: string) => {
    if (!symbols.has(s)) return;
    setSym(s);
    setTab('inst');
    window.scrollTo(0, 0);
  };
  const pick = (k: Tab) => {
    setTab(k);
    window.scrollTo(0, 0);
  };

  // 18.10.2026, его слово: «менюшка внизу… чтобы она была всегда внизу, а прокрутка работала мимо неё» — меню
  // закреплено (fixed: sticky ломается от overflow у страницы), снизу у содержимого запас под него (tg-v2.css)
  const nav = (
    <nav className="tg-nav" aria-label="Разделы терминала">
      {/* 29.10.2026: пять вкладок (школьный бот) — подписи мельче, чтобы «Инструмент» не рвался посреди слова (tg-v2.css) */}
      <div className={tabs.length >= 5 ? 'tg-nav-in many' : 'tg-nav-in'} role="tablist" aria-label="Разделы терминала" style={{ '--n': tabs.length } as CSSProperties}>
        {tabIdx >= 0 ? (
          <span className="tg-nav-ind" aria-hidden="true" style={{ transform: `translateX(${tabIdx * 100}%)` }}>
            <span className="cv2-drop" />
          </span>
        ) : null}
        {tabs.map(([k, n]) => {
          const locked = !!d.limited && !ALWAYS_OPEN.includes(k);
          const Icon = locked ? Lock : ICON[k];
          return (
            <button key={k} type="button" role="tab" aria-selected={tab === k} data-locked={locked ? '' : undefined} onClick={() => pick(k)}>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
              <span className="tg-nav-t">{n}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  const shell = (body: ReactNode, withTabs = true) => (
    <TmViewCtx.Provider value={view}>
      <div className="cv2 tv2 tgv2">
        <Room />
        {/* 25.10.2026: после запуска скан открывает окно сверху вниз */}
        {scan ? <div className="tm-scan" aria-hidden="true" /> : null}
        <main className={withTabs ? 'tg-page with-nav' : 'tg-page'}>
          {demoBar}
          {body}
        </main>
        {withTabs ? nav : null}
      </div>
    </TmViewCtx.Provider>
  );

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
      <div className="tg-screen">
        <div className="tv2-panel tg-msg tv2-in">
          <div className="tg-msg-eye">
            <BrandEye size={40} />
          </div>
          <p>{msg}</p>
          <NextBtn label={cta[0]} url={cta[1]} />
        </div>
      </div>,
      false,
    );
  }

  const r = rows.find((x) => x.symbol === sym) || rows[0];
  const pic = r ? (r[kind] as string | null) : null;
  const videos = parseJournalVideos(d.videos);
  const kinds = r ? KINDS.filter(([k]) => r[k]) : [];

  let body: ReactNode = null;
  if (d.limited && !ALWAYS_OPEN.includes(tab)) {
    // 18.10.2026 вечер, его «согласен»: после 7 дней пробы остаётся журнал решений, остальное — после подписки
    body = (
      <div className="tv2-panel tv2-lock tg-lock">
        <Lock size={22} aria-hidden="true" />
        {/* 18.10.2026 вечер, его слово: «мои решения пускай будут для всех… доступ после подписки — вот так лучше написать» */}
        <p className="tg-lock-t">
          {fresh ? 'Журнал решений открыт всем.' : 'Журнал моих решений открыт всем — вкладка «Решения».'}
          <br />
          {fresh ? AFTER_QUIZ : 'Инструменты, скринер, ТОП-лист и «Сделки до и после» — доступ после подписки.'}
        </p>
        {fresh ? <NextBtn label="Ответить на 4 вопроса в боте" url={BOT_URL} /> : <NextBtn label="Доступ после подписки — написать Сергею" url={SERGEY_URL} />}
      </div>
    );
  } else if (tab === 'inst') {
    body = r ? (
      <div>
        {bot === 'school' ? (
          <div className="tg-note">
            {/* 29.10.2026, его слово «открой всё на 7 дней»: в пробе все инструменты, как у подписчика (было: 3 для примера
                и «все инструменты — после подписки»). Эта вкладка открыта только в пробе, после неё — замок */}
            7 дней пробы: все инструменты, как у подписчиков. {PC_NOTE}
          </div>
        ) : null}
        <TgPicker rows={rows} cur={r} onPick={setSym} />
        <h1 className="tg-ins-title">{r.title || r.symbol}</h1>
        <Decision r={r} narrow />
        {kinds.length ? (
          <div className="tg-kinds">
            <DropGroup variant="sm" label="Картинка бота" value={kind} onChange={(k) => setKind(k as keyof MarketRow)} items={kinds.map(([k, n]) => ({ key: k as string, label: n }))} />
          </div>
        ) : null}
        {pic ? <img src={pubUrl(pic)} alt={r.symbol} className="tg-chart-img" /> : null}
      </div>
    ) : (
      <div className="tv2-panel tv2-empty">Инструментов пока нет.</div>
    );
  } else if (tab === 'scr') {
    // 29.10.2026: у школьного бота ТОП-лист и группы одной вкладкой — сначала ТОП-лист, под ним весь рынок по группам
    body =
      bot === 'school' && d.feeds?.screener ? (
        <>
          <ScreenerCards part="top" doc={d.feeds.screener} symbols={symbols} onOpen={open} />
          <ScreenerCards doc={d.feeds.screener} symbols={symbols} onOpen={open} />
        </>
      ) : (
        <ScreenerCards doc={d.feeds?.screener} symbols={symbols} onOpen={open} />
      );
  } else if (tab === 'top') {
    body = <ScreenerCards part="top" doc={d.feeds?.screener} symbols={symbols} onOpen={open} />;
  } else if (tab === 'dec') {
    body = (
      <>
        {bot === 'school' ? (
          <div className="tg-note">
            {/* 19.10.2026: в школьном боте решения старше 3 дней (tg_terminal) — человек должен знать, почему нет свежих.
                29.10.2026: в 7 дней пробы решения приходят сразу, задержка только после пробы */}
            {d.limited ? (
              'Здесь мои решения старше 3 дней. Подписчики получают их сразу, в момент решения.'
            ) : (
              <>7 дней пробы: мои решения приходят сюда сразу, в момент решения, как у подписчиков. {PC_NOTE}</>
            )}
            {/* 20.10.2026, его «да» (пункт Б): человек попадает сразу сюда и вкладки с замком может не открыть */}
            {fresh && d.limited ? (
              <div className="tg-note-strong">
                {AFTER_QUIZ}{' '}
                <button type="button" className="tg-link" onClick={() => go(BOT_URL)}>
                  Ответить на вопросы
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        {/* 25.10.2026: как в кабинете — новые с прошлого захода решения с меткой «новое», плашки допуска и отказа
            ставятся штампом (fx); что человек уже видел, помнит этот телефон, отдельно для каждого бота */}
        <VerdictsFeed doc={d.feeds?.verdicts} outcomes={d.feeds?.outcomes} videos={videos} symbols={symbols} onOpen={open} picUrl={pubUrl} privateCrypto={d.admin ? d.feeds?.verdicts_crypto || { items: [] } : undefined} seenKey={`tg-${bot}`} fx />
      </>
    );
  } else if (tab === 'tm') {
    body = <TimeMachine doc={d.feeds?.timemachine} symbols={symbols} onOpen={open} />;
  } else if (tab === 'price') {
    body = <TgPrices />;
  }
  // 25.10.2026: раздел проявляется при переключении вкладки
  return shell(
    <div key={tab} className="tm-sec tg-sec">
      {body}
    </div>,
  );
}
