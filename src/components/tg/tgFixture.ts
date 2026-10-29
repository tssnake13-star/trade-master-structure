import { demoData } from '@/components/terminal2/fixture';
import type { TimeItem } from '@/components/terminal/TimeMachine';
import type { Bot, TgData } from './tgCommon';

/**
 * ДЕМО-ДАННЫЕ для превью терминала в Телеграме (/school/tg-preview/:bot), чтобы экран можно было посмотреть без
 * Телеграма. Инструменты, решения журнала и их итоги — те же демо, что у превью веб-терминала (terminal2/fixture.ts);
 * свечи «Сделок до и после» сгенерированы здесь. Всё это написано руками и на экране подписано «демо-данные»:
 * это не рынок, не решения Сергея и не итоги его счёта. Настоящая страница /tg/:bot этот файл не берёт.
 */

export type TgDemoMode = 'full' | 'limited' | 'quiz' | 'noaccess';

const H = 3600e3;
const D = 24 * H;
type Bar = [string, number, number, number, number];

/** Свечи демо: детерминированный шум (LCG по seed), чтобы картинка не прыгала от перезагрузки */
function bars(start: number, step: number, n: number, p0: number, vol: number, drift: number, seed: number, hours: boolean): Bar[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out: Bar[] = [];
  let p = p0;
  for (let i = 0; i < n; i++) {
    const o = p;
    const c = o + (rnd() - 0.5 + drift) * vol;
    const h = Math.max(o, c) + rnd() * vol * 0.5;
    const l = Math.min(o, c) - rnd() * vol * 0.5;
    const t = new Date(start + i * step).toISOString();
    out.push([hours ? t.slice(0, 13) + ':00' : t.slice(0, 10), +o.toFixed(5), +h.toFixed(5), +l.toFixed(5), +c.toFixed(5)]);
    p = c;
  }
  return out;
}

/** Решение с тремя графиками: до решения cut свечей, после — остальные */
function tmItem(time: number, instrument: string, side: 'LONG' | 'SHORT', verdict: TimeItem['verdict'], reason: string, result: string, p0: number, vol: number, seed: number): TimeItem {
  const dir = side === 'LONG' ? 1 : -1;
  const mk = (step: number, cut: number, after: number, v: number, sd: number, hours: boolean) => {
    const b = bars(time - cut * step, step, cut + after, p0, v, 0.04 * dir, sd, hours);
    return { cut, bars: b };
  };
  return {
    time: new Date(time).toISOString(),
    instrument,
    side,
    verdict,
    reason,
    scenario: '1',
    result,
    text: 'Демо: что было дальше.',
    tf: { H4: mk(4 * H, 40, 18, vol * 0.4, seed + 1, true), D1: mk(D, 34, 12, vol, seed + 2, false), W1: mk(7 * D, 26, 4, vol * 2.2, seed + 3, false) },
  };
}

function timemachine(now: number): TimeItem[] {
  const base = now - 12 * D;
  return [
    tmItem(base, 'EURUSD', 'LONG', 'ДОПУСК', 'Неделя и дневка вверх, подтверждение на дневке есть.', 'ВОШЁЛ · ТЕЙК 9,5 к 1', 1.152, 0.004, 11),
    tmItem(base - 3 * D, 'AUDUSD', 'LONG', 'ОТКАЗ', 'Дневка против недели.', 'НЕ ВХОДИЛ', 0.655, 0.0025, 23),
    tmItem(base - 8 * D, 'USDCAD', 'SHORT', 'ДОПУСК', 'Все критерии сошлись, запас хода есть.', 'ВОШЁЛ · СТОП', 1.401, 0.0035, 37),
  ];
}

/**
 * full — бот Echo-Gate: подписчик; школьный бот: 7 дней пробы (несколько инструментов, решения старше 3 дней).
 * limited — школьный бот после пробы: открыт журнал решений и стоимость, остальное с замком.
 * quiz — школьный бот, ещё не ответил на 4 вопроса (метка n=1): то же, что limited, со своим текстом.
 * noaccess — экран без доступа: у Echo-Gate «подписка не найдена», у школьного — «журнал открыт всем».
 */
export function tgDemo(bot: Bot, mode: TgDemoMode, now: number): { d: TgData; fresh: boolean } {
  if (mode === 'noaccess') return { d: { ok: false, reason: bot === 'echo' ? 'no_access' : 'school_expired' }, fresh: false };
  const t = demoData(bot === 'echo' ? 'sub' : 'trial', now);
  const d: TgData = {
    ok: true,
    pub: null,
    admin: false,
    limited: bot === 'school' && mode !== 'full',
    // картинки бота в демо — заглушки с подписью (TgPreview, demoPic): сценарий есть только у инструмента со сценарием
    rows: t.rows.map((r) => ({ ...r, chart_cycles: r.scenario ? `${r.symbol}|сценарий` : null, chart_trend: `${r.symbol}|накопления`, chart_all: `${r.symbol}|все циклы` })),
    feeds: { ...t.feeds, ...(bot === 'school' ? { timemachine: { items: timemachine(now) } } : null) },
    videos: null,
  };
  return { d, fresh: bot === 'school' && mode === 'quiz' };
}
