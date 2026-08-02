import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/**
 * SchoolAnalytics — «Аналитика» (/school/admin/analytics). Своя статистика вместо
 * внешних счётчиков: считает всё функция analytics_summary на стороне БД, сюда
 * приходит готовая сводка. Доступ только админу (проверка и в RLS, и в функции).
 */

const ACCENT = '#e1a84d';
const COOL = '#8aa6d6';
const BG = '#080808';
const FG = '#e8e0d0';
const CARD = '#181410';
const BORDER = '#1a1a1a';
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Syne', system-ui, sans-serif";
const DISPLAY = "'Cormorant', Georgia, 'Times New Roman', serif";

type Summary = {
  visits: number;
  pageviews: number;
  clicks: number;
  /** сколько ЧЕЛОВЕК нажали хотя бы одну кнопку (для честной конверсии) */
  clickers?: number;
  /** визиты владельца — считаются отдельно, в основные цифры не входят */
  owner?: { visits: number; pageviews: number; clicks: number; last_at: string | null };
  by_page?: { path: string; views: number; visits: number }[];
  by_day: { day: string; visits: number; views?: number }[];
  by_source: { source: string; visits: number }[];
  by_device: { device: string; visits: number }[];
  by_section: { section: string; visits: number }[];
  by_click: { target: string; clicks: number; visits: number }[];
};

/** Человеческие названия блоков и кнопок — чтобы в отчёте не было id из кода. */
const SECTION_NAMES: Record<string, string> = {
  hero: 'Главный экран',
  problem: 'Проблема',
  verdict: 'Разбор сделок',
  transformation: 'Трансформация',
  proof: 'Отзывы',
  stats: 'Результаты',
  trades: 'Сделки',
  filter: 'Фильтр (кому подойдёт)',
  difference: 'Отличие',
  included: 'Что входит',
  'trading-system': 'Архитектура',
  protection: 'Защита капитала',
  stages: 'Путь',
  formats: 'Тарифы',
  author: 'Автор',
  faq: 'Вопросы',
};

const CLICK_NAMES: Record<string, string> = {
  hero_bot: 'Главный экран → бот',
  hero_scroll_verdict: 'Главный экран → разбор сделок',
  hero_dm: 'Главный экран → личка',
  verdict_razbor: 'Разбор сделок → бот (/razbor)',
  final_bot: 'Финальный блок → бот',
  package_trade_system: 'Тариф Trade System',
  package_trade_os: 'Тариф Trade OS',
  package_trade_os_plus: 'Тариф Trade OS Plus',
  access_razbor: 'Страница цен → разбор сделок',
  access_apply: 'Страница цен → заявка на обучение',
};

const SOURCE_NAMES: Record<string, string> = {
  direct: 'Прямые заходы',
  internal: 'Внутренние переходы',
  instagram: 'Instagram',
  telegram: 'Telegram',
  youtube: 'YouTube',
  google: 'Google',
  yandex: 'Яндекс',
  dzen: 'Дзен',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const PERIODS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
];

/**
 * База возвращает только дни, когда были заходы. Для графика достраиваем весь
 * период: 7 дней — 7 столбиков, 90 — 90, дни без посетителей показываем нулём.
 * Иначе по графику не видно провалов и он врёт о равномерности.
 */
function fillMissingDays(byDay: { day: string; visits: number }[], days: number) {
  const map = new Map(byDay.map(d => [d.day, d.visits]));
  const out: { day: string; visits: number; label: string }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // ключ в том же формате, что и в БД (YYYY-MM-DD)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({
      day: key,
      visits: map.get(key) ?? 0,
      label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return out;
}

function Kpi({ value, label, hint, color = FG }: { value: string | number; label: string; hint?: string; color?: string }) {
  return (
    <div className="p-5" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, backgroundColor: CARD }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 38, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#777', marginTop: 8 }}>
        {label}
      </div>
      {hint && <div style={{ fontFamily: SANS, fontSize: 12, color: '#8a8378', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

/** Горизонтальная полоса — для источников, блоков и кликов. */
function Bars({ title, rows, max, accent = ACCENT, empty }: {
  title: string;
  rows: { name: string; value: number; extra?: string }[];
  max: number;
  accent?: string;
  empty: string;
}) {
  return (
    <div className="p-5" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, backgroundColor: CARD }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#777', marginBottom: 16 }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: '#666' }}>{empty}</p>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.name}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span style={{ fontFamily: SANS, fontSize: 13, color: FG }}>{r.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: accent, fontVariantNumeric: 'tabular-nums' }}>
                  {r.value}{r.extra ? ` · ${r.extra}` : ''}
                </span>
              </div>
              <div style={{ height: 6, backgroundColor: '#0d0b09', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${max > 0 ? Math.round((r.value / max) * 100) : 0}%`, height: '100%', backgroundColor: accent, opacity: 0.75 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SchoolAnalytics() {
  const { session, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
    if (!authLoading && session && role && role !== 'admin') navigate('/school/dashboard', { replace: true });
  }, [authLoading, session, role, navigate]);

  const load = async (period: number) => {
    setLoading(true);
    setError('');
    const { data: res, error: err } = await supabase.rpc('analytics_summary', { _days: period });
    if (err) {
      setError(err.message || 'Не удалось загрузить статистику');
      setData(null);
    } else {
      setData(res as unknown as Summary);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (role === 'admin') void load(days);
  }, [role, days]);

  const totalVisits = data?.visits ?? 0;
  const heroVisits = data?.by_section.find(s => s.section === 'hero')?.visits ?? 0;
  const funnelBase = heroVisits || totalVisits;
  // весь период по дням, включая дни без посетителей
  const chartDays = fillMissingDays(data?.by_day ?? [], days);

  return (
    <div data-school-skin className="min-h-screen" style={{ backgroundColor: BG, color: FG }}>
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: BORDER, backgroundColor: 'rgba(8,8,8,0.85)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/school/admin')}
            className="flex items-center gap-2 hover:opacity-70 transition"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#888' }}
          >
            <ArrowLeft size={14} />
            Админ / <span style={{ color: ACCENT }}>Аналитика</span>
          </button>
          <button
            onClick={() => void load(days)}
            className="flex items-center gap-2 hover:opacity-70 transition"
            style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}
          >
            <RefreshCw size={12} /> Обновить
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
          ◆ Статистика сайта
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: FG }}>
          Кто приходит и докуда доходит
        </h1>

        {/* Период */}
        <div className="mt-6 flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                padding: '8px 16px', borderRadius: 6,
                border: `1px solid ${days === p.days ? ACCENT : BORDER}`,
                backgroundColor: days === p.days ? `${ACCENT}18` : 'transparent',
                color: days === p.days ? ACCENT : '#777',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="mt-10" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666' }}>
            Загрузка
          </p>
        )}

        {error && (
          <div className="mt-8 p-5" style={{ border: '1px solid #4a2418', borderRadius: 10, backgroundColor: '#1a0f0a' }}>
            <p style={{ fontFamily: SANS, fontSize: 13, color: '#e88a6a' }}>{error}</p>
            <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12.5, color: '#8a8378' }}>
              Если написано, что функции нет — значит миграция аналитики ещё не применена к базе.
            </p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPI */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi value={data.visits} label="Посетителей" hint="уникальные сессии" color={ACCENT} />
              <Kpi value={data.pageviews} label="Просмотров страниц" />
              <Kpi value={data.clicks} label="Клики по кнопкам" hint={`нажимали ${data.clickers ?? 0} чел.`} color={COOL} />
              <Kpi
                // считаем по ЛЮДЯМ, а не по кликам: иначе один посетитель,
                // нажавший три кнопки, давал бы 300%
                value={`${totalVisits > 0 ? Math.round(((data.clickers ?? 0) / totalVisits) * 100) : 0}%`}
                label="Дошли до действия"
                hint="нажали кнопку / все посетители"
                color={COOL}
              />
            </div>

            {/* Посещения по дням */}
            <div className="mt-3 p-5" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, backgroundColor: CARD }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#777', marginBottom: 16 }}>
                Посетители по дням
              </div>
              {data.by_day.length === 0 ? (
                <p style={{ fontFamily: SANS, fontSize: 13, color: '#666' }}>Пока нет данных — статистика начнёт набираться с первых заходов.</p>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    {/* столбиков ровно столько, сколько дней в периоде; ширину
                        recharts подбирает сам, зазор уменьшаем на длинных периодах */}
                    <BarChart data={chartDays} barCategoryGap={days > 30 ? '8%' : days > 7 ? '15%' : '25%'}>
                      <CartesianGrid stroke="#221e1a" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#666', fontSize: days > 30 ? 8 : 10, fontFamily: MONO }}
                        stroke="#2a2620"
                        /* на 30 и 90 днях подписи не влезут — показываем каждую N-ю */
                        interval={days > 30 ? 8 : days > 7 ? 2 : 0}
                        tickMargin={6}
                        minTickGap={2}
                      />
                      <YAxis tick={{ fill: '#666', fontSize: 10, fontFamily: MONO }} stroke="#2a2620" allowDecimals={false} width={28} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ backgroundColor: '#0d0b09', border: `1px solid ${BORDER}`, borderRadius: 8, fontFamily: SANS, fontSize: 12 }}
                        labelStyle={{ color: FG }}
                        formatter={(v: number) => [v, 'посетители']}
                        labelFormatter={(l: string) => `Дата: ${l}`}
                      />
                      <Bar dataKey="visits" fill={ACCENT} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Источники + устройства */}
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Bars
                title="Откуда пришли"
                rows={data.by_source.map(s => ({ name: SOURCE_NAMES[s.source] || s.source, value: s.visits }))}
                max={Math.max(1, ...data.by_source.map(s => s.visits))}
                empty="Пока нет данных."
              />
              <Bars
                title="Устройства"
                rows={data.by_device.map(d => ({
                  name: d.device === 'mobile' ? 'Телефон' : d.device === 'desktop' ? 'Компьютер' : 'Неизвестно',
                  value: d.visits,
                  extra: totalVisits > 0 ? `${Math.round((d.visits / totalVisits) * 100)}%` : undefined,
                }))}
                max={Math.max(1, ...data.by_device.map(d => d.visits))}
                accent={COOL}
                empty="Пока нет данных."
              />
            </div>

            {/* Страницы */}
            {data.by_page && data.by_page.length > 0 && (
              <div className="mt-3">
                <Bars
                  title="Страницы"
                  rows={data.by_page.map(p => ({
                    name: p.path === '/' ? 'Лендинг' : p.path === '/access' ? 'Страница цен' : p.path,
                    value: p.visits,
                    extra: `${p.views} просмотров`,
                  }))}
                  max={Math.max(1, ...data.by_page.map(p => p.visits))}
                  empty="Пока нет данных."
                />
              </div>
            )}

            {/* Воронка внимания */}
            <div className="mt-3">
              <Bars
                title="Докуда доскроллили (воронка внимания)"
                rows={data.by_section.map(s => ({
                  name: SECTION_NAMES[s.section] || s.section,
                  value: s.visits,
                  extra: funnelBase > 0 ? `${Math.round((s.visits / funnelBase) * 100)}%` : undefined,
                }))}
                max={Math.max(1, ...data.by_section.map(s => s.visits))}
                empty="Пока нет данных о прокрутке."
              />
            </div>

            {/* Клики */}
            <div className="mt-3">
              <Bars
                title="Клики по кнопкам"
                rows={data.by_click.map(c => ({
                  name: CLICK_NAMES[c.target] || c.target,
                  value: c.clicks,
                  extra: `${c.visits} чел.`,
                }))}
                max={Math.max(1, ...data.by_click.map(c => c.clicks))}
                accent={COOL}
                empty="Пока никто не нажимал кнопки за этот период."
              />
            </div>

            {/* Свои визиты — отдельной строкой, в цифры выше не входят */}
            <div className="mt-3 p-5 flex flex-wrap items-center gap-x-8 gap-y-3" style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, backgroundColor: 'transparent' }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#777' }}>
                Ваши визиты · отдельно
              </div>
              <div className="flex flex-wrap gap-x-7 gap-y-2" style={{ fontFamily: MONO, fontSize: 12, color: '#8a8378' }}>
                <span>Заходов: <b style={{ color: FG }}>{data.owner?.visits ?? 0}</b></span>
                <span>Просмотров: <b style={{ color: FG }}>{data.owner?.pageviews ?? 0}</b></span>
                <span>Кликов: <b style={{ color: FG }}>{data.owner?.clicks ?? 0}</b></span>
                {data.owner?.last_at && (
                  <span>Последний: <b style={{ color: FG }}>{new Date(data.owner.last_at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</b></span>
                )}
              </div>
            </div>

            <p className="mt-6" style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.6, color: '#8a8378', maxWidth: '70ch' }}>
              Цифры выше — только посетители: ваши заходы вынесены в отдельную строку, локальная разработка не считается.
              Браузер помечается как ваш при входе в кабинет; на телефоне откройте сайт с адресом
              {' '}<code style={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>?owner=1</code> — снять пометку можно через
              {' '}<code style={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>?owner=0</code>.
              IP-адреса и cookie не собираются — сессия анонимна и живёт до закрытия вкладки.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
