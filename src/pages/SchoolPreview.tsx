import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Home, BookOpen, Radio, Lock, Settings, LogOut, ArrowRight } from 'lucide-react';
import '@/styles/school-v3.css';

/**
 * /school/preview — v3 "editorial terminal" reskin of the student cabinet,
 * shown on DEMO data. Reproduces the LOOK only (no new entities): the same
 * blocks the live dashboard already has — sidebar, greeting hero, continue
 * card + progress ring, KPI strip, live streams, programs grid — restyled in
 * the v3 system. The production /school/dashboard is untouched.
 */

const GOLD = 'oklch(0.82 0.14 72)';
const FG = 'oklch(0.92 0.02 80)';
const MUT = 'oklch(0.62 0.02 75)';
const FAINT = 'oklch(0.46 0.015 75)';
const LINE = 'oklch(0.22 0.008 255)';
const SURF = 'oklch(0.14 0.01 75)';
const BG2 = 'oklch(0.12 0.01 75)';
const MONO = "'Space Mono', ui-monospace, monospace";
const DISPLAY = "'Cormorant', Georgia, serif";

const DEMO = {
  name: 'Александр',
  fullName: 'Александр Т.',
  status: 'Платный · TM 4.5',
  mainCourse: 'TRADE MASTER 4.5',
  completed: 14,
  total: 24,
  nextNum: 6,
  nextTitle: 'Фильтрация контекста',
  nextDesc: 'Как отбросить 80% сетапов и оставить только рабочие — где система допуска отделяет импульс от структуры.',
  daysIn: 42,
  daysTotal: 90,
  finalInDays: 48,
};
const PCT = Math.round((DEMO.completed / DEMO.total) * 100);

const NAV = [
  { icon: Home, label: 'Главная', n: '01', active: true },
  { icon: BookOpen, label: 'Программа', n: '02' },
  { icon: Radio, label: 'Эфиры', n: '03' },
];

const PROGRAMS = [
  { tag: 'Платный · Основной', title: 'TRADE MASTER 4.5', sub: '24 занятия · 4 модуля · сертификация', done: 14, total: 24, state: 'В процессе' as const },
  { tag: 'Бесплатный · Старт', title: 'TLT · Допуск к сделке', sub: '5 занятий · вводная программа', done: 5, total: 5, state: 'Завершено' as const },
  { tag: 'Премиум · 1-1', title: 'Менторство', sub: '8 сессий · персонально с Сергеем', locked: 'Доступ после TM 4.5' },
  { tag: 'Закрытый клуб', title: 'Inner circle', sub: 'Закрытая группа выпускников', locked: 'Доступ по приглашению' },
];

// Demo "лестница этапов" — the v3 redesign of the course-detail view
// (SelectedCourseView on the live dashboard). State: done | current | locked.
type StageState = 'done' | 'current' | 'locked';
const STAGES: { n: string; title: string; meta: string; state: StageState; desc?: string }[] = [
  { n: '01', title: 'Архитектура рынка', meta: 'Модуль 1 · 3 урока', state: 'done' },
  { n: '02', title: 'Психология капитала', meta: 'Модуль 1 · 4 урока', state: 'done' },
  { n: '03', title: 'Echo Gate — допуск к сделке', meta: 'Модуль 2 · 4 урока', state: 'done' },
  { n: '04', title: 'Контекст и структура', meta: 'Модуль 2 · 3 урока', state: 'done' },
  { n: '05', title: 'Точки разворота', meta: 'Модуль 2 · 2 урока', state: 'done' },
  { n: '06', title: 'Фильтрация контекста', meta: 'Модуль 3 · 4 урока', state: 'current', desc: DEMO.nextDesc },
  { n: '07', title: 'Hunter Bot — автоматизация входа', meta: 'Модуль 3 · 5 уроков', state: 'locked' },
  { n: '08', title: 'Risk Sentinel — защита капитала', meta: 'Модуль 4 · 3 урока', state: 'locked' },
];

// next live: Mon (1) & Thu (4), 20:00 GMT+5
function nextLive(now: Date) {
  const dur = 2 * 60 * 60 * 1000;
  const startUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 0; i < 14; i++) {
    const day = new Date(startUtc + i * 86400000);
    const gmt5 = new Date(day.getTime() + 5 * 3600000);
    const dow = gmt5.getUTCDay();
    if (dow === 1 || dow === 4) {
      const ev = Date.UTC(gmt5.getUTCFullYear(), gmt5.getUTCMonth(), gmt5.getUTCDate(), 15, 0, 0);
      if (ev + dur > now.getTime()) return new Date(ev);
    }
  }
  return new Date(now.getTime() + 86400000);
}
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Ring({ pct }: { pct: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(pct); return; }
    let raf = 0, s = 0;
    const step = (t: number) => { if (!s) s = t; const p = Math.min(1, (t - s) / 1000); setV(Math.round(pct * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <svg width={150} height={150} viewBox="0 0 140 140">
      <circle cx={70} cy={70} r={r} fill="none" stroke={LINE} strokeWidth={6} />
      <circle cx={70} cy={70} r={r} fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 70 70)" />
      <text x={70} y={66} textAnchor="middle" fill={FG} fontSize={30} fontFamily={DISPLAY} fontWeight={500}>{v}%</text>
      <text x={70} y={86} textAnchor="middle" fill={FAINT} fontSize={9} fontFamily={MONO} letterSpacing="0.18em">ДОПУСК</text>
    </svg>
  );
}

const cell: CSSProperties = { background: SURF, border: `1px solid ${LINE}`, padding: '20px 22px' };
const eyebrow: CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD };
const kLabel: CSSProperties = { fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT };
const kNum: CSSProperties = { fontFamily: DISPLAY, fontWeight: 500, fontSize: 34, color: FG, lineHeight: 1, marginTop: 10, fontVariantNumeric: 'tabular-nums' };

// v3 "лестница этапов" — vertical progress ladder for a course's blocks.
// Gold rail runs through completed stages and stops at the current one.
function StageLadder() {
  return (
    <div style={{ position: 'relative' }}>
      {STAGES.map((st, i) => {
        const last = i === STAGES.length - 1;
        const node =
          st.state === 'done'
            ? { border: GOLD, bg: 'oklch(0.82 0.14 72 / 0.10)', color: GOLD, glyph: '✓' as const }
            : st.state === 'current'
              ? { border: GOLD, bg: GOLD, color: BG2, glyph: st.n }
              : { border: LINE, bg: 'transparent', color: FAINT, glyph: 'lock' as const };
        // Connector below this node is gold once the stage is passed (done).
        const connectorGold = st.state === 'done';
        return (
          <div
            key={st.n}
            className="lk-rise"
            style={{ position: 'relative', paddingLeft: 72, paddingBottom: last ? 0 : 30, opacity: st.state === 'locked' ? 0.5 : 1 }}
          >
            {/* connector */}
            {!last && (
              <span style={{ position: 'absolute', left: 23, top: 46, bottom: -2, width: 2, background: connectorGold ? GOLD : LINE }} />
            )}
            {/* node */}
            <span
              style={{
                position: 'absolute', left: 2, top: 0, width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1.5px solid ${node.border}`, background: node.bg, color: node.color,
                fontFamily: MONO, fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums',
              }}
            >
              {node.glyph === 'lock' ? <Lock size={15} /> : node.glyph === '✓' ? '✓' : node.glyph}
            </span>

            {st.state === 'current' ? (
              <div
                className="lk-card"
                style={{ padding: '18px 20px', marginTop: -4, background: `radial-gradient(circle at 0% 0%, oklch(0.82 0.14 72 / 0.14), ${SURF} 62%)`, borderColor: 'oklch(0.55 0.10 72)' }}
              >
                <div style={{ ...eyebrow, marginBottom: 5 }}>Этап {st.n} · сейчас</div>
                <h3 className="lk-display" style={{ fontSize: 27, marginBottom: 10 }}>{st.title}</h3>
                {st.desc && <p style={{ fontFamily: 'var(--ui)', fontSize: 13, lineHeight: 1.55, color: MUT, maxWidth: '54ch', marginBottom: 16 }}>{st.desc}</p>}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT }}>{st.meta} · ◷ 24 мин</span>
                  <span className="lk-btn lk-btn--gold">Открыть <ArrowRight className="arr" size={15} /></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4" style={{ minHeight: 44 }}>
                <div className="min-w-0">
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: st.state === 'done' ? MUT : FAINT, marginBottom: 3 }}>
                    Этап {st.n} · {st.state === 'done' ? 'пройден' : 'закрыто'}
                  </div>
                  <h3 className="lk-display" style={{ fontSize: 25, color: st.state === 'done' ? 'oklch(0.82 0.02 80)' : FAINT }}>{st.title}</h3>
                </div>
                {st.state === 'done' ? (
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, flexShrink: 0 }}>Повторить</span>
                ) : (
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT, flexShrink: 0 }}>{st.meta}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SchoolPreview() {
  const now = useNow();
  const live = useMemo(() => nextLive(now), [now]);
  const diff = Math.max(0, live.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const upcoming = [live, new Date(live.getTime() + 3 * 86400000), new Date(live.getTime() + 7 * 86400000)];

  return (
    <div className="lkv3 min-h-screen flex">
      {/* preview banner */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, display: 'flex', justifyContent: 'space-between', padding: '7px 18px', background: 'oklch(0.09 0.012 70 / 0.85)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${LINE}`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: MUT }}>
        <span>Preview · Кабинет v3 · демо-данные</span>
        <Link to="/school/dashboard" style={{ color: GOLD }}>← Боевой кабинет</Link>
      </div>

      {/* ===== Sidebar ===== */}
      <aside className="flex-shrink-0 flex flex-col" style={{ width: 256, borderRight: `1px solid ${LINE}`, background: BG2, paddingTop: 34 }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, letterSpacing: '-0.01em', color: FG }}>
            TRADE LIKE <span style={{ color: GOLD }}>TYO</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: FAINT, marginTop: 4 }}>Кабинет ученика</div>
        </div>

        <div style={{ padding: '16px 14px 6px', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: FAINT }}>Навигация</div>
        <nav className="px-2">
          {NAV.map((it) => (
            <div key={it.label} className="lk-navitem" data-active={it.active || undefined}>
              <span className="flex items-center gap-2.5"><it.icon size={13} style={{ color: it.active ? GOLD : FAINT }} />{it.label}</span>
              <span className="n">{it.n}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 14px 6px', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: FAINT }}>Доступ</div>
        <nav className="px-2">
          {['Менторство', 'Inner circle'].map((l) => (
            <div key={l} className="lk-navitem" style={{ opacity: 0.5 }}>
              <span className="flex items-center gap-2.5"><Lock size={12} style={{ color: FAINT }} />{l}</span>
              <span style={{ color: FAINT }}>✕</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto" style={{ borderTop: `1px solid ${LINE}`, padding: 14 }}>
          <div className="flex items-center gap-3" style={{ padding: '6px 6px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.2 0.01 75), oklch(0.14 0.01 75))', color: GOLD, fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>А</div>
            <div className="min-w-0 flex-1">
              <div style={{ fontFamily: 'var(--ui)', fontSize: 13, color: FG }}>{DEMO.fullName}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginTop: 2 }}>{DEMO.status}</div>
            </div>
            <Settings size={18} style={{ color: FAINT }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: FAINT, marginBottom: 5 }}>
              <span>Допуск · этап 03</span><span style={{ color: GOLD }}>{PCT}%</span>
            </div>
            <div style={{ height: 3, background: LINE }}><div style={{ width: `${PCT}%`, height: '100%', background: GOLD }} /></div>
          </div>
          <div className="lk-navitem" style={{ marginTop: 10, justifyContent: 'flex-start', gap: 8 }}><LogOut size={13} /> Выход</div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="flex-1 min-w-0 flex flex-col" style={{ paddingTop: 34 }}>
        {/* top bar */}
        <header className="flex items-center justify-between" style={{ padding: '14px 32px', borderBottom: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-2.5">
            <span className="lk-pulse" />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUT }}>TLT · Терминал · Live</span>
          </div>
          <div className="flex items-center gap-5" style={{ fontFamily: MONO, fontSize: 11, color: FAINT }}>
            <span>{now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} · {pad(now.getHours())}:{pad(now.getMinutes())}</span>
            <span style={{ color: MUT }}>Поддержка</span>
          </div>
        </header>

        <div className="flex-1" style={{ maxWidth: 1080, width: '100%', margin: '0 auto', padding: '40px 32px 64px' }}>
          {/* Hero */}
          <div className="lk-rise" style={{ marginBottom: 40 }}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>С возвращением</div>
            <h1 className="lk-display" style={{ fontSize: 'clamp(38px, 5vw, 64px)' }}>
              {DEMO.name}, <em>система ждёт допуска.</em>
            </h1>
            <p style={{ fontFamily: 'var(--ui)', fontSize: 15, lineHeight: 1.6, color: MUT, maxWidth: '60ch', marginTop: 16 }}>
              Вы прошли <span style={{ color: FG }}>{PCT}%</span> основной программы и стоите на этапе фильтрации входов. Сегодня — блок {pad(DEMO.nextNum)}. Войдите в режим, повторите состояние, захватите цель.
            </p>
          </div>

          {/* Continue + Ring */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ marginBottom: 14 }}>
            <button className="lk-card lg:col-span-2 text-left lk-rise" style={{ padding: 30, background: `radial-gradient(circle at 0% 0%, oklch(0.82 0.14 72 / 0.10), ${SURF} 60%)` }}>
              <div style={{ ...eyebrow, marginBottom: 12 }}>▶ Продолжить · блок {pad(DEMO.nextNum)}</div>
              <h2 className="lk-display" style={{ fontSize: 27, marginBottom: 10 }}>{DEMO.nextTitle}</h2>
              <p style={{ fontFamily: 'var(--ui)', fontSize: 13.5, lineHeight: 1.55, color: MUT, maxWidth: '52ch', marginBottom: 18 }}>{DEMO.nextDesc}</p>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-4" style={{ fontFamily: MONO, fontSize: 11, color: FAINT }}><span>◷ 24 мин</span><span>▤ 2 видео</span><span>↓ PDF</span></div>
                <span className="lk-btn lk-btn--gold">Открыть урок <ArrowRight className="arr" size={15} /></span>
              </div>
            </button>
            <div className="lk-card lk-rise flex flex-col items-center justify-center" style={{ padding: 24 }}>
              <Ring pct={PCT} />
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUT, marginTop: 10 }}>Допуск открыт</div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
            <div style={cell}><div style={kLabel}>День в системе</div><div style={kNum}>{DEMO.daysIn}<span style={{ color: FAINT, fontSize: 20 }}> / {DEMO.daysTotal}</span></div></div>
            <div style={cell}><div style={kLabel}>Завершено блоков</div><div style={kNum}>{DEMO.completed}<span style={{ color: FAINT, fontSize: 20 }}> / {DEMO.total}</span></div></div>
            <div style={cell}><div style={kLabel}>Осталось блоков</div><div style={kNum}>{DEMO.total - DEMO.completed}<span style={{ color: FAINT, fontSize: 20 }}> / {DEMO.total}</span></div></div>
            <div style={{ ...cell, borderColor: 'oklch(0.55 0.10 72)' }}><div style={kLabel}>До финальной сессии</div><div style={{ ...kNum, color: GOLD }}>{DEMO.finalInDays}<span style={{ color: FAINT, fontSize: 20 }}> дней</span></div></div>
          </div>

          {/* Live streams */}
          <div className="lk-card" style={{ padding: 26, marginBottom: 14 }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div style={{ ...eyebrow, marginBottom: 14 }}><span className="lk-pulse" style={{ marginRight: 8 }} />Прямые эфиры</div>
                <div className="flex gap-3">
                  {[['Д', d], ['Ч', h], ['М', m], ['С', s]].map(([l, val], i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 40, color: FG, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{pad(val as number)}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: FAINT, marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FAINT, marginTop: 12 }}>До ближайшего эфира</div>
              </div>
              <div className="flex flex-col gap-2" style={{ minWidth: 220 }}>
                {upcoming.map((dt, i) => (
                  <div key={i} className="flex items-center justify-between" style={{ borderTop: i ? `1px solid ${LINE}` : 'none', padding: '8px 0' }}>
                    <span style={{ fontFamily: 'var(--ui)', fontSize: 13, color: FG }}>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][(dt.getDay() + 6) % 7]} {dt.getDate()}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: FAINT }}>20:00 · GMT+5</span>
                    {i === 0 && <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD, marginLeft: 8 }}>СКОРО</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Programs */}
          <div style={{ marginTop: 30 }}>
            <div className="flex items-end justify-between" style={{ marginBottom: 16 }}>
              <div>
                <div style={{ ...eyebrow, marginBottom: 8 }}>Программы</div>
                <h2 className="lk-display" style={{ fontSize: 30 }}>Ваш путь обучения</h2>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUT }}>все курсы →</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROGRAMS.map((p) => {
                const pct = p.total ? Math.round((p.done! / p.total) * 100) : 0;
                const locked = !!p.locked;
                return (
                  <div key={p.title} className="lk-card" style={{ padding: 22, opacity: locked ? 0.55 : 1 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: locked ? FAINT : GOLD }}>{p.tag}</span>
                      {p.state && <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: p.state === 'Завершено' ? 'oklch(0.72 0.16 150)' : MUT }}>{p.state === 'Завершено' ? '✓ ' : ''}{p.state}</span>}
                    </div>
                    <h3 className="lk-display" style={{ fontSize: 23, marginBottom: 6 }}>{p.title}</h3>
                    <p style={{ fontFamily: 'var(--ui)', fontSize: 12.5, color: MUT, marginBottom: 14 }}>{p.sub}</p>
                    {locked ? (
                      <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: FAINT }}><Lock size={11} /> {p.locked}</div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1" style={{ height: 2, background: LINE }}><div style={{ width: `${pct}%`, height: '100%', background: p.state === 'Завершено' ? 'oklch(0.72 0.16 150)' : GOLD }} /></div>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: MUT, fontVariantNumeric: 'tabular-nums' }}>{p.done}/{p.total}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wordmark divider — "мысли крупными буквами", как на лендинге */}
          <div style={{ margin: '56px 0 30px', textAlign: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 'clamp(40px, 7vw, 84px)', letterSpacing: '-0.03em', color: 'oklch(0.30 0.012 75)', lineHeight: 1 }}>
              путь <em style={{ fontStyle: 'italic', color: 'oklch(0.50 0.10 72)' }}>системы</em>
            </div>
          </div>

          {/* ===== Лестница этапов (v3 course-detail) ===== */}
          <div>
            <div className="flex items-end justify-between flex-wrap gap-3" style={{ marginBottom: 24 }}>
              <div>
                <div style={{ ...eyebrow, marginBottom: 8 }}>Программа · этап 06 из 08</div>
                <h2 className="lk-display" style={{ fontSize: 'clamp(30px, 4vw, 46px)' }}>
                  TRADE <em>MASTER</em> 4.5
                </h2>
              </div>
              <div className="flex items-center gap-3" style={{ minWidth: 200 }}>
                <div className="flex-1" style={{ height: 2, background: LINE }}><div style={{ width: `${Math.round((5 / 8) * 100)}%`, height: '100%', background: GOLD }} /></div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: MUT, fontVariantNumeric: 'tabular-nums' }}>5/8</span>
              </div>
            </div>
            <StageLadder />
          </div>

          <footer className="flex items-center justify-between" style={{ marginTop: 56, paddingTop: 20, borderTop: `1px solid ${LINE}`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: FAINT }}>
            <span>© TRADELIKETYO · 2026</span>
            <span style={{ color: MUT }}>Telegram автора →</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
