import type { FeedDocs } from '@/components/terminal/Feeds';
import type { MarketRow } from '@/components/terminal/parts';
import type { Scene } from '@/components/terminal/scene';
import type { TimeItem } from '@/components/terminal/TimeMachine';
import type { JournalVideo } from '@/lib/journalVideos';

/**
 * Терминал v2 «в стиле приборов» (29.10.2026, Сергей: «делай терминал в стиле приборов… полноценную страницу…
 * не выкладывай его пока»). Здесь только форма данных и порядок вкладок — те же, что были в SchoolTerminal.tsx.
 * Данные приходят из двух мест: настоящий терминал (useTerminalLive, база) и превью (fixture, демо-данные).
 * Экран один и тот же (TerminalView), меняется только источник.
 */

// 21.09.2026, его слово: вкладку «Резонанс» из «Глаза системы» убрать
// 27.09.2026, его слово: «переименуй топ циклов… или, наверное, просто топ. Оставь» — вкладка «ТОП»
export type Section = 'instrument' | 'screener' | 'top' | 'trend' | 'falsex' | 'verdicts' | 'timemachine' | 'history';
export const SECTIONS: [Section, string][] = [
  ['instrument', 'Инструмент'],
  ['screener', 'Скринер'],
  ['top', 'ТОП-лист'], // 03.10.2026, его слово: «переименовать в топ-лист»
  ['trend', 'Тренд'],
  // 23.09.2026, его слово: вкладка — только админу
  ['falsex', 'Выход против недели'],
  // 25.09.2026, его слово: «переименовать в журнал решений… или даже журнал решений Сергея»
  ['verdicts', 'Журнал решений Сергея'],
  // 21.10.2026, его слово: «Верни машину времени в веб-версию… переименуй в сделки до и после»
  ['timemachine', 'Сделки до и после'],
  // 25.09.2026, его слово: «показывать не один день, а изменения… где ошибается система, где не ошибается»
  ['history', 'История направления'],
];
// 25.09.2026 и 13.10.2026, его слово: эти вкладки видит только администратор, отдельной строкой; ученику их ленты
// не загружаются вовсе (ключ ленты совпадает с вкладкой)
export const ADMIN_ONLY: Section[] = ['trend', 'falsex', 'history'];
// пробному под замком (TrialLock) — в строке вкладок идут последними
export const TRIAL_LOCKED: Section[] = ['screener', 'top', 'timemachine'];
// ленты, которые бот кладёт в базу сразу после его кнопки: вкладка → ключ ленты (24.09 журнал, 25.09 скринер)
export const LIVE_FEED: Partial<Record<Section, string>> = { verdicts: 'verdicts', screener: 'screener', top: 'screener' };

export type Tab = 'Анализ' | 'Циклы' | 'Накопления' | 'Рейндж' | 'Как в боте' | 'История';
export const TABS: Tab[] = ['Анализ', 'Циклы', 'Накопления', 'Рейндж', 'Как в боте', 'История'];

export type Kind = 'cycles' | 'trend' | 'all';
export const KINDS: [Kind, string, string][] = [
  ['cycles', 'сценарий', 'неделя сверху · дневка снизу · циклы сценария'],
  ['trend', 'накопления', 'неделя сверху · дневка снизу · накопления, свинги, реверс'],
  ['all', 'все циклы', 'неделя и дневка · обе стороны · без фильтра сценария'],
];

export interface Meta {
  updated_at: string | null;
  bars_at: string | null;
  build: string | null;
}

/** Всё, что экран показывает. Экран ничего не считает по правилам системы — только раскладывает готовое. */
export interface TerminalData {
  rows: MarketRow[];
  feeds: FeedDocs;
  /** время каждой ленты в базе (market_feed.updated_at) — для прибора «Данные» */
  feedAt: Record<string, string | null>;
  videos: JournalVideo[];
  meta: Meta | null;
  until: string | null;
  /** проба с замками (демо-экран; с 30.10.2026 настоящая проба замков не имеет) */
  trial: boolean;
  /** проба, открытая целиком (30.10.2026): всё как в подписке, только подпись «пробный доступ до …» */
  trialOpen?: boolean;
  lockedList: { symbol: string; title: string | null }[];
  hiddenVerdicts: string[];
}

/** Откуда экран дочитывает то, что грузится по требованию: картинка бота, живой график, «Сделки до и после». */
export interface TerminalSource {
  chartUrl: (path: string) => Promise<string | null>;
  scene: (symbol: string, kind: Kind) => Promise<Scene | null>;
  timeMachine: () => Promise<{ items?: TimeItem[] }>;
  /** демо: картинок решений нет, ящик не спрашиваем */
  picUrl?: (path: string) => string;
}

// Почему нет сценария — словами бота из первой строки карточки /info
// («🌀 USDCNH — Сценария нет: цель недельного цикла вниз взята; …»)
export const noScenReason = (r: MarketRow) => {
  const m = ((r.card_lines || [])[0] || '').match(/—\s*(Сценария нет.*)$/);
  return m ? m[1].trim() : 'Сценария нет.';
};
