import type { MarketRow } from '@/components/terminal/parts';
import type { FeedDocs } from '@/components/terminal/Feeds';
import type { TimeItem } from '@/components/terminal/TimeMachine';
import type { BootSteps } from '@/components/terminal/Boot';

/**
 * Общее у терминала в Телеграме (/tg/:bot, pages/TgTerminal.tsx) и его демо (/school/tg-preview/:bot, TgPreview.tsx):
 * вкладки ботов, адреса кнопок, форма ответа базы. Разнесено из TgTerminal.tsx 29.10.2026 без изменений по смыслу.
 */

// 29.10.2026: фон ночной комнаты терминала v2 (cabinet-v2.css, --bg) — им же красим шапку и фон Телеграма
export const NIGHT_BG = '#060A12';

export type Bot = 'echo' | 'school';
export type Tab = 'inst' | 'scr' | 'top' | 'dec' | 'tm' | 'price';
// 29.10.2026: значки вкладок — линейные (lucide, TgView.tsx, ICON) вместо эмодзи: цветные эмодзи выбивались из палитры
export const TABS: Record<Bot, [Tab, string][]> = {
  echo: [['inst', 'Инструмент'], ['scr', 'Скринер'], ['top', 'ТОП-лист'], ['dec', 'Решения']],
  // 20.10.2026, его «вкладка «Цены» в терминале школьного бота, кнопки «Все цены» ведут в неё» (&tab=price).
  // 29.10.2026, его слово «открой всё на 7 дней»: в пробе и скринер с ТОП-листом, как у подписчика (после пробы — с замком).
  // Одной вкладкой «Скринер» (сверху ТОП-лист, под ним группы, TgView.tsx): шесть вкладок на телефоне не помещаются —
  // «Инструмент» и «Стоимость» рвутся посреди слова
  school: [['dec', 'Решения'], ['inst', 'Инструмент'], ['scr', 'Скринер'], ['tm', 'Сделки до и после'], ['price', 'Стоимость']],
};
// вкладки, открытые и после пробы, и до вопросов: журнал решений и цены
export const ALWAYS_OPEN: Tab[] = ['dec', 'price'];
// строки запуска (Boot): терминал в боте грузится одним запросом по подписи Телеграма — свои шаги
export const BOOT_LINES: [keyof BootSteps, string][] = [
  ['access', 'вход через Telegram'],
  ['market', 'проверка доступа'],
  ['feeds', 'рынок и журнал решений'],
];

export interface TgData {
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
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; openLink?: (u: string) => void; openTelegramLink?: (u: string) => void; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void; platform?: string; isVersionAtLeast?: (v: string) => boolean; requestFullscreen?: () => void } };
  }
}

// 19.10.2026: куда ведёт кнопка с экрана, где дальше идти некуда
export const BOT_URL = 'https://t.me/New_TradeLikeTYO_bot';
export const SERGEY_URL = 'https://t.me/tradeliketyo';
export const SITE_URL = 'https://www.tradeliketyo.com/';
// 20.10.2026, разбор воронки, пункт 5: бот ставит метку n=1 тому, кто ещё не ответил на 4 вопроса. Ему открыт журнал,
// остальное откроется после вопросов. Метка только для текста, доступ решает база по пропуску
// 29.10.2026: после вопросов на 7 дней открывается весь терминал, как у подписчика
export const AFTER_QUIZ = 'Проверка сделки и весь терминал, как у подписчиков, откроются на 7 дней после 4 коротких вопросов в боте.';
// 29.10.2026, его слово: «если хотите получить полное представление о системе, лучше посмотреть с компьютера» — тот же
// терминал открывается кнопкой «Терминал» в Телеграме на компьютере, на большом экране
export const PC_NOTE = 'Полную картину удобнее смотреть на большом экране: откройте этот бот в Telegram на компьютере, кнопка «Терминал» там тоже есть.';

export function go(url: string) {
  const w = window.Telegram?.WebApp;
  if (url.startsWith('https://t.me/') && w?.openTelegramLink) w.openTelegramLink(url);
  else if (w?.openLink) w.openLink(url);
  else window.open(url, '_blank');
}

export function NextBtn({ label, url }: { label: string; url: string }) {
  return (
    <button type="button" className="cv2-btn cv2-btn-brass tg-next" onClick={() => go(url)}>
      {label}
    </button>
  );
}
