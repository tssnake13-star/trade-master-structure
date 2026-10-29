import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { BootSteps } from '@/components/terminal/Boot';
import TgView, { TgBoot } from '@/components/tg/TgView';
import { NIGHT_BG, type Bot, type TgData } from '@/components/tg/tgCommon';

/**
 * 18.10.2026, его слово «Все, давай внедряй»: терминал внутри Телеграма — кнопка «Терминал» в меню бота.
 *  /tg/echo   — бот Echo-Gate, подписчики: Инструмент · Скринер · ТОП-лист · Решения;
 *  /tg/school — школьный бот, холодные: Решения · Инструмент · Скринер (с ТОП-листом) · Сделки до и после · Цены
 *  (29.10.2026, его слово «открой всё на 7 дней»: в пробе всё, как у подписчика, решения сразу; после пробы — журнал)
 *  (21.10.2026, его слово: «переименуй машину времени в сделки до и после»)
 *  (20.10.2026: цены подписки и обучения, не выходя из Телеграма; открыты всем). ⛔ 20.10.2026 вечер, его слово «Убери
 *  из школьного бота в терминале тренажёр» — вкладки «Тренажёр» нет (из веб-кабинета она ушла в тот же день, раньше).
 * Его слово: «графики должны быть статичные, как в боте» — картинки бота, в машине времени рисунок бота без
 * масштаба и сдвига. Кто открыл, проверяет база (tg_terminal) по подписи Телеграма; без подписки — экран-объяснение.
 *
 * 29.10.2026: здесь только вход и загрузка (подпись Телеграма → tg_terminal); экран — components/tg/TgView.tsx,
 * в ночном облике веб-терминала v2. Демо без Телеграма — /school/tg-preview/:bot (components/tg/TgPreview.tsx).
 */

const SU = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

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

export default function TgTerminal() {
  const bot: Bot = useParams().bot === 'school' ? 'school' : 'echo';
  const [d, setD] = useState<TgData | null>(null);
  // 25.10.2026, его «да» на список из веб-версии: пока терминал грузится — запуск с глазом, строки загораются по настоящим
  // шагам (Telegram отдал подпись, база проверила вход и прислала данные), без искусственной паузы; потом скан открывает окно
  const [boot, setBoot] = useState<BootSteps>({ access: false, market: false, feeds: false });
  const [scan, setScan] = useState(false);
  const fresh = useMemo(() => bot === 'school' && new URLSearchParams(window.location.search).get('n') === '1', [bot]);

  useEffect(() => {
    let alive = true;
    loadTg().then(async () => {
      const tg = window.Telegram?.WebApp;
      try {
        tg?.ready();
        tg?.expand();
        // 29.10.2026: шапка и фон Телеграма — цвет ночной комнаты терминала v2
        tg?.setHeaderColor?.(NIGHT_BG);
        tg?.setBackgroundColor?.(NIGHT_BG);
        // 29.10.2026, его слово «полное представление о системе — лучше посмотреть с компьютера»: в Telegram на компьютере
        // мини-приложение открывается маленьким окном — школьный терминал там раскрывается на весь экран (Bot API 8.0);
        // на телефоне и в веб-версии Telegram — как было
        if (bot === 'school' && ['tdesktop', 'macos', 'unigram'].includes(tg?.platform || '') && tg?.isVersionAtLeast?.('8.0')) {
          tg.requestFullscreen?.();
        }
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

  const pub = d?.pub;
  const pubUrl = useCallback((p: string) => `${SU}/storage/v1/object/public/tgpub/${pub}/${p}`, [pub]);
  const sceneUrl = useCallback((p: string) => `${SU}/storage/v1/object/public/tgpub/${p}`, []);

  if (!d) return <TgBoot steps={boot} />;
  return <TgView bot={bot} d={d} fresh={fresh} scan={scan} pubUrl={pubUrl} sceneUrl={sceneUrl} />;
}
