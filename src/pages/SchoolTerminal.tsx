import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import FloatingWatermark from '@/components/school/FloatingWatermark';
import { ArrowLeft, Search } from 'lucide-react';
import { ACCENT, BG, BORDER, DIM, DISCLAIMER, FG, MONO, SANS, UP, card, label, pill, fmtDate, fmtWhen } from '@/components/terminal/theme';
import { Arrow, CycleCard, Lines, Side, type MarketRow } from '@/components/terminal/parts';
import { FalseExitFeed, ResonanceFeed, ScreenerFeed, TrendFeed, VerdictsFeed, type FeedDocs } from '@/components/terminal/Feeds';
import LiveChart from '@/components/terminal/LiveChart';
import { LAYERS, layersOf, type Layer, type Scene } from '@/components/terminal/scene';

/**
 * SchoolTerminal — «Глаз системы» (/school/terminal). Название — его, 21.09.2026:
 * так он называет скринер в выпусках; внутри это терминал рынка.
 *
 * Экран ничего не считает. Всё, что здесь видно, посчитало ядро на VPS и
 * положило в базу: строка на инструмент, три картинки и общие ленты. Поэтому
 * в этом файле нет ни одного правила системы — только показ готового.
 *
 * Доступ — отдельная подписка со сроком (terminal_access). Закрывает её RLS
 * в базе, а не этот код: без действующей подписки запрос возвращает пусто.
 */

// Таблицы терминала ещё не попали в сгенерированные типы базы — читаем их
// через клиент без схемы, а форму данных держим интерфейсами (parts, Feeds).
const db = supabase as unknown as SupabaseClient;

interface Meta {
  updated_at: string | null;
  bars_at: string | null;
  build: string | null;
}

type Section = 'instrument' | 'screener' | 'trend' | 'falsex' | 'resonance' | 'verdicts';
const SECTIONS: [Section, string][] = [
  ['instrument', 'Инструмент'],
  ['screener', 'Скринер'],
  ['trend', 'Тренд'],
  ['falsex', 'Ложные выходы'],
  ['resonance', 'Резонанс'],
  ['verdicts', 'Решения'],
];

type Tab = 'Анализ' | 'Циклы' | 'Накопления' | 'Рейндж' | 'Как в боте';
const TABS: Tab[] = ['Анализ', 'Циклы', 'Накопления', 'Рейндж', 'Как в боте'];

type Kind = 'cycles' | 'trend' | 'all';
const KINDS: [Kind, string, string][] = [
  ['cycles', 'сценарий', 'неделя сверху · дневка снизу · циклы сценария'],
  ['trend', 'накопления', 'неделя сверху · дневка снизу · накопления, свинги, реверс'],
  ['all', 'все циклы', 'неделя и дневка · обе стороны · без фильтра сценария'],
];

export default function SchoolTerminal() {
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [rows, setRows] = useState<MarketRow[]>([]);
  const [feeds, setFeeds] = useState<FeedDocs>({});
  const [meta, setMeta] = useState<Meta | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('Анализ');
  const [kind, setKind] = useState<Kind>('cycles');
  const [pic, setPic] = useState<string | null>(null);
  const [wide, setWide] = useState(typeof window === 'undefined' ? true : window.innerWidth >= 1100);
  const [full, setFull] = useState(false);
  // живой график (заход 3): те же фигуры, что на картинке бота, данными; картинка — запасной вид
  const [live, setLive] = useState(true);
  const [scene, setScene] = useState<Scene | null>(null);
  const [hidden, setHidden] = useState<Set<Layer>>(new Set());

  const selected = params.get('i');
  const section = (SECTIONS.find(([s]) => s === params.get('s'))?.[0] || 'instrument') as Section;

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const load = useCallback(async () => {
    const [accessRes, metaRes, rowsRes, feedRes] = await Promise.all([
      user
        ? db.from('terminal_access').select('expires_at').eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      db.from('market_meta').select('updated_at, bars_at, build').maybeSingle(),
      db.from('market_snapshot').select('*').order('sort_order').order('symbol'),
      db.from('market_feed').select('key, data'),
    ]);
    setUntil(((accessRes.data as { expires_at?: string } | null)?.expires_at) || null);
    setMeta((metaRes.data as Meta) || null);
    setRows((rowsRes.data || []) as MarketRow[]);
    const docs: FeedDocs = {};
    for (const f of (feedRes.data || []) as { key: keyof FeedDocs; data: never }[]) docs[f.key] = f.data;
    setFeeds(docs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  // Раз в минуту смотрим только время расчёта — строка крошечная. Сошлось —
  // ничего не трогаем, изменилось — перечитываем витрину целиком.
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(async () => {
      const { data } = await db.from('market_meta').select('updated_at').maybeSingle();
      const fresh = (data as { updated_at?: string } | null)?.updated_at || null;
      if (fresh && fresh !== meta?.updated_at) load();
    }, 60000);
    return () => window.clearInterval(t);
  }, [user, meta?.updated_at, load]);

  const symbols = useMemo(() => new Set(rows.map((r) => r.symbol)), [rows]);

  const list = useMemo(() => {
    const q = query.trim().toUpperCase();
    return rows.filter((r) => !q || r.symbol.includes(q) || (r.title || '').toUpperCase().includes(q));
  }, [rows, query]);

  const cur = useMemo(() => rows.find((r) => r.symbol === selected) || rows[0] || null, [rows, selected]);

  const go = useCallback(
    (s: Section, sym?: string) => {
      const next: Record<string, string> = { s };
      const i = sym || cur?.symbol;
      if (i) next.i = i;
      setParams(next, { replace: s === section });
      window.scrollTo({ top: 0 });
    },
    [cur?.symbol, section, setParams],
  );
  const openSymbol = useCallback((sym: string) => go('instrument', sym), [go]);

  // Картинки лежат в закрытом ящике: ссылка живёт час и только для вошедшего.
  useEffect(() => {
    let alive = true;
    const path = kind === 'cycles' ? cur?.chart_cycles : kind === 'trend' ? cur?.chart_trend : cur?.chart_all;
    setPic(null);
    if (!path) return;
    supabase.storage
      .from('terminal')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setPic(data?.signedUrl || null);
      });
    return () => {
      alive = false;
    };
  }, [cur?.symbol, cur?.chart_cycles, cur?.chart_trend, cur?.chart_all, kind, meta?.updated_at]);

  // Данные живого графика: только если есть сама картинка этого вида — иначе
  // сценария нет, и живому графику показывать нечего (как и в боте).
  useEffect(() => {
    let alive = true;
    setScene(null);
    const has = kind === 'cycles' ? cur?.chart_cycles : kind === 'trend' ? cur?.chart_trend : cur?.chart_all;
    const sym = cur?.symbol;
    if (!sym || !has || !live) return;
    db.from('market_chart')
      .select('scene')
      .eq('symbol', sym)
      .eq('kind', kind)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setScene(((data as { scene?: Scene } | null)?.scene) || null);
      });
    return () => {
      alive = false;
    };
  }, [cur?.symbol, cur?.chart_cycles, cur?.chart_trend, cur?.chart_all, kind, live, meta?.updated_at]);

  const present = useMemo(() => layersOf(scene), [scene]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, color: DIM, display: 'grid', placeItems: 'center', fontFamily: SANS }}>
        загружаю рынок…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: BG, color: FG, fontFamily: SANS, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ ...card, padding: 28, maxWidth: 520, textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: ACCENT }}>ГЛАЗ СИСТЕМЫ</div>
          <h1 style={{ fontSize: 22, margin: '14px 0 10px' }}>Доступ пока не открыт</h1>
          <p style={{ color: DIM, fontSize: 14, lineHeight: 1.6 }}>
            Глаз системы входит в подписку экосистемы и выдаётся отдельно, со сроком.
            Если подписка у вас есть, а экран пустой — напишите в поддержку, откроем.
          </p>
          <button onClick={() => navigate('/school/dashboard')} style={{ ...pill(true), marginTop: 18, padding: '11px 18px' }}>
            в кабинет
          </button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div style={{ ...card, padding: 10, height: wide ? 'calc(100vh - 190px)' : 'auto', maxHeight: wide ? undefined : 320, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 10px' }}>
        <Search size={14} color={DIM} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="поиск инструмента"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: FG, fontFamily: SANS, fontSize: 13 }}
        />
      </div>
      {list.map((r) => {
        const on = section === 'instrument' && cur?.symbol === r.symbol;
        return (
          <button
            key={r.symbol}
            onClick={() => openSymbol(r.symbol)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              textAlign: 'left',
              padding: '8px 8px',
              borderRadius: 8,
              backgroundColor: on ? '#221d16' : 'transparent',
              border: `1px solid ${on ? `${ACCENT}55` : 'transparent'}`,
              cursor: 'pointer',
              color: FG,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 12 }}>{r.symbol}</span>
            <span style={{ display: 'flex', gap: 4 }}>
              <Arrow text={r.trend_w1} />
              <Arrow text={r.trend_d1} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: DIM, minWidth: 62, textAlign: 'right' }}>{r.price_text || '—'}</span>
          </button>
        );
      })}
    </div>
  );

  const right = cur && (
    <div style={{ ...card, padding: 12, height: wide ? 'calc(100vh - 190px)' : 'auto', overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...pill(tab === t), padding: '5px 9px' }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Анализ' && (
        <div>
          {[
            ['инструмент', cur.symbol],
            ['цена', cur.price_text || '—'],
            ['неделя', `${cur.w_dir || '—'} · критерии ${cur.w_n ?? '—'} из 3`],
            ['дневка', `${cur.d_dir || '—'} · критерии ${cur.d_n ?? '—'} из 3`],
            ['сценарий', cur.scenario ? `${cur.scenario} — ${cur.side === 'LONG' ? 'вверх' : 'вниз'}` : 'нет'],
            ['подтверждение', cur.confirmation ? 'есть' : 'нет'],
            ['поводырь', cur.guide || '—'],
            ['свечи закрыты по', fmtDate(cur.bars_at)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: DIM, fontSize: 12 }}>{k}</span>
              <span style={{ color: FG, fontFamily: MONO, fontSize: 12, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          <div style={{ ...label, marginTop: 14 }}>накопления</div>
          <div style={{ color: FG, fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
            неделя: {cur.trend_w1 || '—'}
            <br />
            дневка: {cur.trend_d1 || '—'}
            <br />
            {cur.trend_total ? <span style={{ color: ACCENT }}>{cur.trend_total}</span> : null}
          </div>
        </div>
      )}
      {tab === 'Циклы' && (
        <div>
          <CycleCard title="цикл недели" c={cur.cycle_w1} />
          <CycleCard title="цикл дневки" c={cur.cycle_d1} />
        </div>
      )}
      {tab === 'Накопления' && <Lines lines={cur.trend_lines} />}
      {tab === 'Рейндж' && <Lines lines={cur.range_lines} />}
      {tab === 'Как в боте' && <Lines lines={cur.card_lines} />}
    </div>
  );

  const instrument = cur && (
    <>
      <div style={{ ...card, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0, fontFamily: MONO, letterSpacing: '0.04em' }}>{cur.symbol}</h1>
          <span style={{ color: DIM, fontSize: 13 }}>{cur.title}</span>
          <span style={{ fontFamily: MONO, fontSize: 18, marginLeft: 'auto' }}>{cur.price_text || '—'}</span>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <div>
            <div style={label}>направление</div>
            <div style={{ marginTop: 5 }}>
              <Side side={cur.side} />
            </div>
          </div>
          <div>
            <div style={label}>сценарий</div>
            <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 13 }}>
              {cur.scenario ? `${cur.scenario} — ${cur.side === 'LONG' ? 'вверх' : 'вниз'}` : 'нет'}
            </div>
          </div>
          <div>
            <div style={label}>подтверждение</div>
            <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 13, color: cur.confirmation ? UP : DIM }}>
              {cur.confirmation ? 'ЕСТЬ' : 'нет'}
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <div style={label}>поводырь</div>
            <div style={{ marginTop: 5, fontSize: 13, color: DIM }}>{cur.guide || '—'}</div>
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: 12 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {KINDS.map(([k, name]) => (
            <button key={k} onClick={() => setKind(k)} style={pill(kind === k)}>
              {name}
            </button>
          ))}
          <span style={{ ...label, marginLeft: 'auto' }}>{KINDS.find(([k]) => k === kind)?.[2]}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setLive(true)} style={{ ...pill(live), padding: '4px 9px' }}>
            живой график
          </button>
          <button onClick={() => setLive(false)} style={{ ...pill(!live), padding: '4px 9px' }}>
            картинка как в боте
          </button>
          {live && scene
            ? LAYERS.filter(([L]) => present.has(L)).map(([L, name]) => (
                <button
                  key={L}
                  onClick={() =>
                    setHidden((h) => {
                      const n = new Set(h);
                      if (n.has(L)) n.delete(L);
                      else n.add(L);
                      return n;
                    })
                  }
                  style={{ ...pill(false), padding: '4px 9px', color: hidden.has(L) ? '#55504a' : FG, textDecoration: hidden.has(L) ? 'line-through' : 'none' }}
                >
                  {name}
                </button>
              ))
            : null}
        </div>
        {live && scene ? (
          <LiveChart scene={scene} hidden={hidden} />
        ) : pic ? (
          <img
            src={pic}
            alt={`${cur.symbol} ${KINDS.find(([k]) => k === kind)?.[1]}`}
            onClick={() => setFull(true)}
            style={{ width: '100%', borderRadius: 10, display: 'block', cursor: 'zoom-in' }}
          />
        ) : (
          <div style={{ color: DIM, fontSize: 13, padding: 24, textAlign: 'center', lineHeight: 1.6 }}>
            {kind === 'cycles' && !cur.scenario
              ? 'Сценария нет — картинка сценария не строится, как и в боте. Все циклы инструмента — на вкладке «все циклы».'
              : 'картинки пока нет'}
          </div>
        )}
      </div>
      {!wide && right ? <div style={{ marginTop: 14 }}>{right}</div> : null}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: FG, fontFamily: SANS, position: 'relative' }}>
      {user ? <FloatingWatermark email={user.email || ''} fullName={null} /> : null}

      <header style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => navigate('/school/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: DIM, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11 }}
        >
          <ArrowLeft size={14} /> кабинет
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: MONO, letterSpacing: '0.2em', fontSize: 13, color: ACCENT }}>ГЛАЗ СИСТЕМЫ</span>
          <span style={label}>Trade Master · TradeLikeTyo</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={label}>обновлено {fmtWhen(meta?.updated_at || null)}</span>
          {until ? <span style={label}>подписка до {fmtDate(until)}</span> : null}
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 6, padding: '12px 14px 0', overflowX: 'auto' }}>
        {SECTIONS.map(([s, name]) => (
          <button key={s} onClick={() => go(s)} style={pill(section === s)}>
            {name}
          </button>
        ))}
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? (section === 'instrument' ? '240px minmax(0, 1fr) 330px' : '240px minmax(0, 1fr)') : '1fr', gap: 14, padding: 14 }}>
        {sidebar}
        <div style={{ minWidth: 0 }}>
          {section === 'instrument' && instrument}
          {section === 'screener' && <ScreenerFeed doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />}
          {section === 'trend' && <TrendFeed doc={feeds.trend} symbols={symbols} onOpen={openSymbol} />}
          {section === 'falsex' && <FalseExitFeed doc={feeds.falsex} symbols={symbols} onOpen={openSymbol} />}
          {section === 'resonance' && <ResonanceFeed doc={feeds.resonance} symbols={symbols} onOpen={openSymbol} />}
          {section === 'verdicts' && <VerdictsFeed doc={feeds.verdicts} symbols={symbols} onOpen={openSymbol} />}
          <div style={{ ...label, marginTop: 14, lineHeight: 1.7 }}>
            {DISCLAIMER}
            {meta?.build ? ` · сборка ${meta.build}` : ''}
          </div>
        </div>
        {wide && section === 'instrument' ? right : null}
      </div>

      {full && pic ? (
        <div
          onClick={() => setFull(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 16, cursor: 'zoom-out' }}
        >
          <img src={pic} alt={cur?.symbol || ''} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10 }} />
        </div>
      ) : null}
    </div>
  );
}
