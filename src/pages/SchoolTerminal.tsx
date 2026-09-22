import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Search } from 'lucide-react';
import { ACCENT, BG, BLUE, BORDER, DIM, DISCLAIMER, FG, MONO, SANS, UP, card, label, pill, fmtDate } from '@/components/terminal/theme';
import { Arrow, CycleCard, Lines, type MarketRow } from '@/components/terminal/parts';
import { Brand, Decision } from '@/components/terminal/Decision';
import { FalseExitFeed, TrendFeed, VerdictsFeed, type FeedDocs } from '@/components/terminal/Feeds';
import { ScreenerCards } from '@/components/terminal/Screener';
import StatusStrip from '@/components/terminal/Status';
import { GEN } from '@/components/terminal/screenerParse';
import LiveChart from '@/components/terminal/LiveChart';
import { LAYERS, layersOf, type Layer, type Scene } from '@/components/terminal/scene';

// 21.09.2026, его слово: серые ползунки «ужасно смотрятся» — тонкие, золото на тёмном,
// как весь кабинет. Стандартные свойства — Chrome и Firefox, ::-webkit — Safari.
const SCROLL_CSS = `
html { scrollbar-color: rgba(225,168,77,0.55) ${BG}; }
.tm-page, .tm-page * { scrollbar-width: thin; scrollbar-color: rgba(225,168,77,0.55) transparent; }
.tm-page ::-webkit-scrollbar { width: 8px; height: 8px; }
.tm-page ::-webkit-scrollbar-track { background: transparent; }
.tm-page ::-webkit-scrollbar-thumb { background: rgba(225,168,77,0.55); border-radius: 8px; }
.tm-page ::-webkit-scrollbar-thumb:hover { background: ${ACCENT}; }
`;

/**
 * SchoolTerminal — TRADE MASTER INSIDE, под ним «Глаз системы» (/school/terminal).
 * Название — его, 21.09.2026 (вечером; до этого экран звался просто «Глаз системы»).
 * Внутри это терминал рынка.
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

// 21.09.2026, его слово: вкладку «Резонанс» из «Глаза системы» убрать
// 21.09.2026: ТОП циклов — своей вкладкой (на телефоне до него под группами было долго листать)
type Section = 'instrument' | 'screener' | 'top' | 'trend' | 'falsex' | 'verdicts';
const SECTIONS: [Section, string][] = [
  ['instrument', 'Инструмент'],
  ['screener', 'Скринер'],
  ['top', 'ТОП циклов'],
  ['trend', 'Тренд'],
  ['falsex', 'Ложные выходы'],
  ['verdicts', 'Решения'],
];

type Tab = 'Анализ' | 'Циклы' | 'Накопления' | 'Рейндж' | 'Как в боте';
const TABS: Tab[] = ['Анализ', 'Циклы', 'Накопления', 'Рейндж', 'Как в боте'];

type Kind = 'cycles' | 'trend' | 'all';
// 21.09.2026, его порядок групп в левом списке: доллар, австралиец, йена, новозеландец,
// канадец, фунт, франк, золото, биткоин (нефть — после золота: группа есть, он её не назвал)
const GROUP_ORDER = ['DXY', 'AUD', 'JPY', 'NZD', 'CAD', 'GBP', 'CHF', 'GOLD', 'OIL', 'BTC'];

// Почему нет сценария — словами бота из первой строки карточки /info
// («🌀 USDCNH — Сценария нет: цель недельного цикла вниз взята; …»)
const noScenReason = (r: MarketRow) => {
  const m = ((r.card_lines || [])[0] || '').match(/—\s*(Сценария нет.*)$/);
  return m ? m[1].trim() : 'Сценария нет.';
};

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
  // телефон: кнопки слоёв — под одной «слои», чтобы не занимали полэкрана
  const [phone, setPhone] = useState(typeof window === 'undefined' ? false : window.innerWidth < 700);
  const [showLayers, setShowLayers] = useState(false);
  // часы для строки свежести: «онлайн» считается от текущего времени, раз в минуту
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);
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
    const onResize = () => {
      setWide(window.innerWidth >= 1100);
      setPhone(window.innerWidth < 700);
    };
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

  // Левый список по группам (21.09.2026). Поводырь стоит в группе, которую ведёт, и первым.
  // Кросс — в группе своего поводыря, как в карточке: AUDNZD ведёт NZDUSD — группа
  // новозеландца, NZDJPY ведёт USDJPY — группа йены (скринер держит их в двух группах).
  // У кого поводырь индекс доллара — группа из скринера: EURUSD в долларе, эфир у биткоина.
  // Его слово 21.09.2026: в группу доллара входят и все поводыри, кроме нефти, — поводырь
  // с долларом в имени стоит и там, и первым в своей группе.
  const groupedList = useMemo(() => {
    const norm = (s: string) => s.toUpperCase().replace(/USDT$/, 'USD');
    const leadOf: Record<string, string> = {};
    for (const r of rows) if (r.extra?.leads) leadOf[norm(r.symbol)] = r.extra.leads;
    const groupOf = (r: MarketRow) => {
      if (r.extra?.leads) return r.extra.leads;
      const lead = r.extra?.leader;
      if (lead && lead !== 'DXY' && leadOf[norm(lead)]) return leadOf[norm(lead)];
      return r.group_key || (lead === 'DXY' ? 'DXY' : 'OTHER');
    };
    const by = new Map<string, MarketRow[]>();
    const put = (g: string, r: MarketRow) => by.set(g, [...(by.get(g) || []), r]);
    for (const r of list) {
      const g = groupOf(r);
      put(g, r);
      if (r.extra?.leads && g !== 'DXY' && r.symbol.toUpperCase().includes('USD')) put('DXY', r);
    }
    const pos = (g: string) => {
      const i = GROUP_ORDER.indexOf(g);
      return i < 0 ? GROUP_ORDER.length : i;
    };
    // внутри группы: её поводырь, за ним поводыри других групп в порядке групп, потом пары по алфавиту
    const rank = (g: string, r: MarketRow) =>
      r.extra?.leads === g ? -1 : r.extra?.leads ? pos(r.extra.leads) : GROUP_ORDER.length + 1;
    return [...by.entries()]
      .sort((a, b) => pos(a[0]) - pos(b[0]))
      .map(([g, rs]): [string, MarketRow[]] => [
        g,
        [...rs].sort((x, y) => rank(g, x) - rank(g, y) || x.symbol.localeCompare(y.symbol)),
      ]);
  }, [rows, list]);

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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Brand />
          </div>
          <h1 style={{ fontSize: 22, margin: '14px 0 10px' }}>Доступ пока не открыт</h1>
          <p style={{ color: DIM, fontSize: 14, lineHeight: 1.6 }}>
            TRADE MASTER INSIDE входит в подписку экосистемы и выдаётся отдельно, со сроком.
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
    // 21.09.2026, его слово: на компьютере список — до низа, до дисклеймера, без ползунка
    <div style={{ ...card, padding: 10, ...(wide ? {} : { maxHeight: 320, overflowY: 'auto' as const }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 10px' }}>
        <Search size={14} color={DIM} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="поиск инструмента"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: FG, fontFamily: SANS, fontSize: 13 }}
        />
      </div>
      {/* 22.09.2026, его вопрос «что обозначают стрелочки?» — подпись прямо над списком */}
      <div style={{ ...label, letterSpacing: '0.08em', textTransform: 'none', padding: '0 8px 4px', lineHeight: 1.5 }}>
        Н — неделя, Д — дневка: тренд по накоплениям · ↑ вверх · ↓ вниз · ~ тренда нет
      </div>
      {groupedList.map(([g, rs]) => (
        <div key={g} style={{ marginBottom: 6 }}>
          <div style={{ ...label, color: ACCENT, padding: '10px 8px 4px' }}>{GEN[g] ? `Группа ${GEN[g]}` : 'Другие'}</div>
          {rs.map((r) => {
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
            <span style={{ fontFamily: MONO, fontSize: 12 }}>
              {r.symbol}
              {r.extra?.leads ? (
                <span title={`сам — поводырь группы ${GEN[r.extra.leads] || r.extra.leads}`} style={{ fontFamily: SANS, fontSize: 10, color: ACCENT, marginLeft: 6 }}>
                  поводырь
                </span>
              ) : null}
            </span>
            <span style={{ display: 'flex', gap: 4 }}>
              <Arrow text={r.trend_w1} tag="Н" tip="неделя" />
              <Arrow text={r.trend_d1} tag="Д" tip="дневка" />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: DIM, minWidth: 62, textAlign: 'right' }}>{r.price_text || '—'}</span>
          </button>
        );
          })}
        </div>
      ))}
    </div>
  );

  // знаков после точки — как у цены инструмента (у золота 2, у евро 5)
  const cycDg = cur?.price_text?.includes('.') ? cur.price_text.split('.')[1].length : 4;
  // 21.09.2026, его просьба по макету: цикл со столбиком «пройдено» — неделя синим, дневка зелёным
  const cycles = cur && (
    <>
      <CycleCard title="цикл недели" c={cur.cycle_w1} color={BLUE} dg={cycDg} />
      <CycleCard title="цикл дневки" c={cur.cycle_d1} color={UP} dg={cycDg} />
    </>
  );

  const right = cur && (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...pill(tab === t), padding: '5px 9px' }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Анализ' && (
        <div>
          {/* 21.09.2026, его слово: инструмент, сценарий, неделя и дневка здесь повторяли
              верхний блок — «лишняя информация»; главное теперь только наверху */}
          {[['свечи закрыты по', fmtDate(cur.bars_at)]].map(([k, v]) => (
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
          <div style={{ marginTop: 14 }}>{cycles}</div>
        </div>
      )}
      {tab === 'Циклы' && <div>{cycles}</div>}
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
          {cur.extra?.leads ? (
            <span style={{ fontSize: 12, color: ACCENT, border: `1px solid ${ACCENT}55`, borderRadius: 6, padding: '1px 8px' }}>
              поводырь группы {GEN[cur.extra.leads] || cur.extra.leads}
            </span>
          ) : null}
          <span style={{ fontFamily: MONO, fontSize: 18, marginLeft: 'auto' }}>{cur.price_text || '—'}</span>
        </div>
        {/* 21.09.2026, его слово: направление, сценарий, подтверждение, поводырь и критерии
            недели и дневки — самое главное об инструменте: крупно, по центру, одним блоком */}
        <Decision r={cur} narrow={phone} />
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
          {live && scene && phone ? (
            <button onClick={() => setShowLayers(!showLayers)} style={{ ...pill(showLayers), padding: '4px 9px' }}>
              слои {showLayers ? '▴' : '▾'}
            </button>
          ) : null}
          {live && scene && (showLayers || !phone)
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
          <LiveChart scene={scene} hidden={hidden} noHead />
        ) : pic ? (
          <img
            src={pic}
            alt={`${cur.symbol} ${KINDS.find(([k]) => k === kind)?.[1]}`}
            onClick={() => setFull(true)}
            style={{ width: '100%', borderRadius: 10, display: 'block', cursor: 'zoom-in' }}
          />
        ) : (
          <div style={{ color: DIM, fontSize: 13, padding: 24, textAlign: 'center', lineHeight: 1.6 }}>
            {/* 21.09.2026, его вопрос по USDCNH: «нет графика или нет CSV?» — говорим прямо, что из двух */}
            {!cur.bars_at
              ? 'Свечей нет: ни CSV из терминала, ни символа в MT5 сервера — посчитать нечего.'
              : kind === 'cycles' && !cur.scenario
                ? `Данные есть — свечи закрыты по ${fmtDate(cur.bars_at)}. ${noScenReason(cur)} Картинку сценария бот рисует, только когда сценарий есть. Накопления и все циклы — на соседних вкладках.`
                : `Данные есть — свечи закрыты по ${fmtDate(cur.bars_at)}, но картинка при последнем обновлении не построилась. Появится со следующим обновлением.`}
          </div>
        )}
      </div>
      {!wide && right ? <div style={{ marginTop: 14 }}>{right}</div> : null}
    </>
  );

  return (
    <div className="tm-page" style={{ minHeight: '100vh', backgroundColor: BG, color: FG, fontFamily: SANS, position: 'relative' }}>
      <style>{SCROLL_CSS}</style>
      {/* 21.09.2026, его слово: бегущая по экрану почта здесь лишняя — «на видео такая защита
          прокатит, а здесь зачем». В уроках с видео она осталась. */}

      <header style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => navigate('/school/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: DIM, background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11 }}
        >
          <ArrowLeft size={14} /> кабинет
        </button>
        {/* название — его, 21.09.2026: как плитка в кабинете — глаз на две строки */}
        <Brand />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <StatusStrip updatedAt={meta?.updated_at || null} feeds={feeds} now={now} />
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
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {section === 'instrument' && instrument}
          {section === 'screener' && <ScreenerCards doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />}
          {section === 'top' && <ScreenerCards part="top" doc={feeds.screener} symbols={symbols} onOpen={openSymbol} />}
          {section === 'trend' && <TrendFeed doc={feeds.trend} symbols={symbols} onOpen={openSymbol} />}
          {section === 'falsex' && <FalseExitFeed doc={feeds.falsex} symbols={symbols} onOpen={openSymbol} />}
          {section === 'verdicts' && <VerdictsFeed doc={feeds.verdicts} symbols={symbols} onOpen={openSymbol} />}
          <div style={{ ...label, marginTop: 'auto', paddingTop: 14, lineHeight: 1.7 }}>
            {DISCLAIMER}
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
