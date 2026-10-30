import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { FeedDocs } from '@/components/terminal/Feeds';
import type { MarketRow } from '@/components/terminal/parts';
import type { Scene } from '@/components/terminal/scene';
import type { TimeItem } from '@/components/terminal/TimeMachine';
import type { BootSteps } from '@/components/terminal/Boot';
import { JOURNAL_VIDEOS_KEY, parseJournalVideos, type JournalVideo } from '@/lib/journalVideos';
import { ADMIN_ONLY, LIVE_FEED, type Meta, type Section, type TerminalData, type TerminalSource } from './model';

/**
 * Данные настоящего терминала — из базы, как было в SchoolTerminal.tsx до 29.10.2026 (логика не менялась):
 *
 * Экран ничего не считает. Всё, что здесь видно, посчитало ядро на VPS и положило в базу: строка на инструмент,
 * три картинки и общие ленты. Доступ — отдельная подписка со сроком (terminal_access). Закрывает её RLS в базе,
 * а не этот код: без действующей подписки запрос возвращает пусто.
 *
 * Пробный доступ (terminal_access.is_trial): 30.10.2026, его «да, делай» — открывается только личной ссылкой из школьного
 * бота (/school/full, функция claim_web_trial) и отдаёт весь терминал, как подписка. Замки 07.10.2026 (3 инструмента,
 * журнал с задержкой, скринер под замком) сняты в базе; от пробы на экране осталась подпись «пробный доступ до …».
 *
 * Обновление: раз в минуту смотрим только время расчёта (market_meta) — изменилось, перечитываем витрину целиком.
 * Пока открыт журнал решений, скринер или ТОП-лист, раз в 3 секунды смотрим время своей ленты (24.09.2026, его слово:
 * «чтобы в журнале допусков допуски появлялись сразу, как я отправил свой вердикт… через 2-3 секунды»; 25.09.2026 —
 * так же со скринером по его ✅ ОДОБРЯЮ).
 */

// Таблицы терминала ещё не попали в сгенерированные типы базы — читаем их через клиент без схемы
const db = supabase as unknown as SupabaseClient;

export function useTerminalLive({ user, isAdmin, section }: { user: { id: string } | null; isAdmin: boolean; section: Section | null }) {
  // ленты «только администратору» ученику не запрашиваются
  const feedQuery = useCallback(() => {
    const q = db.from('market_feed').select('key, data, updated_at');
    // 18.10.2026: verdicts_crypto — его решения по крипте «только мне», ученику не запрашивается (и база не отдаёт)
    // 20.10.2026: лента timemachine большая — в общую загрузку не входит; её грузит вкладка «Сделки до и после»
    const skip = isAdmin ? ['timemachine'] : [...ADMIN_ONLY, 'verdicts_crypto', 'timemachine'];
    return q.not('key', 'in', `(${skip.join(',')})`);
  }, [isAdmin]);

  const [rows, setRows] = useState<MarketRow[]>([]);
  const [feeds, setFeeds] = useState<FeedDocs>({});
  const [feedAt, setFeedAt] = useState<Record<string, string | null>>({});
  const [videos, setVideos] = useState<JournalVideo[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boot, setBoot] = useState<BootSteps>({ access: false, market: false, feeds: false });

  // время каждой ленты, которая уже на экране — его пишет загрузка лент
  const feedAtRef = useRef<Record<string, string | null>>({});
  const readFeeds = (list: { key: keyof FeedDocs; data: never; updated_at?: string }[]) => {
    const docs: FeedDocs = {};
    for (const f of list) {
      docs[f.key] = f.data;
      feedAtRef.current[f.key] = f.updated_at || null;
    }
    setFeedAt({ ...feedAtRef.current });
    return docs;
  };

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
          ? // '*' — чтобы читать is_trial и не падать, пока столбца ещё нет в базе
            db.from('terminal_access').select('*').eq('user_id', user.id).maybeSingle()
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
    setTrialOpen(!isAdmin && !!acc?.is_trial && !!acc.expires_at && new Date(acc.expires_at).getTime() > Date.now());
    setMeta((metaRes.data as Meta) || null);
    setRows((rowsRes.data || []) as MarketRow[]);
    setFeeds(readFeeds((feedRes.data || []) as { key: keyof FeedDocs; data: never; updated_at?: string }[]));
    setLoading(false);
  }, [user, feedQuery, isAdmin]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  // Раз в минуту смотрим только время расчёта — строка крошечная. Сошлось — ничего не трогаем, изменилось —
  // перечитываем витрину целиком.
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(async () => {
      const { data } = await db.from('market_meta').select('updated_at').maybeSingle();
      const fresh = (data as { updated_at?: string } | null)?.updated_at || null;
      if (fresh && fresh !== meta?.updated_at) load();
    }, 60000);
    return () => window.clearInterval(t);
  }, [user, meta?.updated_at, load]);

  // живые ленты открытой вкладки — раз в 3 секунды по времени ленты
  useEffect(() => {
    const key = section ? LIVE_FEED[section] : undefined;
    if (!user || !key) return;
    let alive = true;
    const tick = async () => {
      const { data } = await db.from('market_feed').select('updated_at').eq('key', key).maybeSingle();
      const at = (data as { updated_at?: string } | null)?.updated_at || null;
      if (!alive || !at) return;
      if (at !== feedAtRef.current[key]) {
        const { data: fd } = await feedQuery();
        if (!alive) return;
        setFeeds(readFeeds((fd || []) as unknown as { key: keyof FeedDocs; data: never; updated_at?: string }[]));
      }
      feedAtRef.current[key] = at;
    };
    tick();
    const t = window.setInterval(tick, 3000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [user, section, feedQuery]);

  const data: TerminalData = useMemo(
    () => ({ rows, feeds, feedAt, videos, meta, until, trial: false, trialOpen, lockedList: [], hiddenVerdicts: [] }),
    [rows, feeds, feedAt, videos, meta, until, trialOpen],
  );

  // Картинки лежат в закрытом ящике: ссылка живёт час и только для вошедшего
  const source: TerminalSource = useMemo(
    () => ({
      chartUrl: (path) =>
        Promise.resolve(supabase.storage.from('terminal').createSignedUrl(path, 3600)).then(({ data: d }) => d?.signedUrl || null),
      scene: (symbol, kind) =>
        Promise.resolve(db.from('market_chart').select('scene').eq('symbol', symbol).eq('kind', kind).maybeSingle()).then(
          ({ data: d }) => ((d as { scene?: Scene } | null)?.scene) || null,
        ),
      timeMachine: () =>
        Promise.resolve(db.from('market_feed').select('data').eq('key', 'timemachine').maybeSingle()).then(
          ({ data: d }) => (d as { data?: { items?: TimeItem[] } } | null)?.data || { items: [] },
        ),
    }),
    [],
  );

  return { loading, boot, data, source };
}
