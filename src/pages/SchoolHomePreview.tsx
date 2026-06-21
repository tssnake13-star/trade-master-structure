import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Lock, Settings, LogOut, Menu } from 'lucide-react';
import StructureField from '@/components/landing/StructureField';
import logoVideo from '@/assets/logo-header.mp4';
import { useDashboardTexts } from '@/lib/dashboardTexts';
import { PaidHome, type Course, type Lesson } from './SchoolDashboard';

/**
 * /school/home-preview — the REAL dashboard home rendered on demo data inside a
 * faithful copy of the dashboard shell (sidebar with logo + courses panel, top
 * header). The body is the actual <PaidHome>; the shell is replicated here on
 * demo data (the live shell is auth/data-bound). Production is untouched.
 */

const ACCENT = '#e1a84d';
const COOL = '#8aa6d6';
const FG = '#e8e0d0';
const BG = '#080808';
const CARD = '#181410';
const BORDER = '#1a1a1a';
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Syne', system-ui, sans-serif";
const DISPLAY = "'Cormorant', Georgia, 'Times New Roman', serif";

const CabinetBg = () => (
  <StructureField
    position="fixed"
    opacity={0.5}
    zIndex={0}
    mask="radial-gradient(150% 120% at 50% 38%, #000 45%, transparent 92%)"
  />
);

// --- demo course/lessons (same shape the live dashboard loads from Supabase) ---
const MAIN: Course = { id: 'demo-tm45', title: 'TRADE MASTER 4.5', subtitle: 'Основная программа · 8 блоков системы допуска', is_free: false, sort_order: 1 };
const EXTRA: Course = { id: 'demo-echo', title: 'Echo Gate · Допуск', subtitle: 'Углублённый блок по системе фильтрации входов', is_free: false, sort_order: 2 };

const TITLES = [
  'Архитектура рынка', 'Психология капитала', 'Echo Gate — допуск к сделке', 'Контекст и структура',
  'Точки разворота', 'Фильтрация контекста', 'Hunter Bot — автоматизация входа', 'Risk Sentinel — защита капитала',
];
const MAIN_LESSONS: Lesson[] = TITLES.map((title, i) => ({ id: `demo-l${i + 1}`, course_id: MAIN.id, title, description: null, sort_order: i + 1 }));
const COMPLETED = new Set(MAIN_LESSONS.slice(0, 5).map((l) => l.id));
const MAIN_PROGRESS = { completed: 5, total: 8 };
const NEXT = MAIN_LESSONS[5];

// sidebar course list (accessible + locked), as the real <aside> renders
const SIDEBAR_COURSES = [
  { title: 'TRADE MASTER 4.5', done: 5, total: 8, locked: false },
  { title: 'Echo Gate · Допуск', done: 2, total: 6, locked: false },
  { title: 'Менторство', done: 0, total: 0, locked: true },
  { title: 'Inner circle', done: 0, total: 0, locked: true },
];

// next Mon(1)/Thu(4) 20:00 GMT+5 (= 15:00 UTC), 3 upcoming
function upcomingLives(now: Date): Date[] {
  const out: Date[] = [];
  const startUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 0; i < 21 && out.length < 3; i++) {
    const gmt5 = new Date(startUtc + i * 86400000 + 5 * 3600000);
    const dow = gmt5.getUTCDay();
    if (dow === 1 || dow === 4) {
      const ev = Date.UTC(gmt5.getUTCFullYear(), gmt5.getUTCMonth(), gmt5.getUTCDate(), 15, 0, 0);
      if (ev + 2 * 3600000 > now.getTime()) out.push(new Date(ev));
    }
  }
  return out;
}
function countdown(target: Date, now: Date) {
  let diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  return { d, h, m, s: Math.floor(diff / 1000) };
}

export default function SchoolHomePreview() {
  const { t } = useDashboardTexts();
  const [now, setNow] = useState(() => new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const lives = upcomingLives(now);
  const programEnd = new Date(now.getTime() + 48 * 86400000);
  const recentActivity = MAIN_LESSONS.slice(0, 3).map((l, i) => ({
    lesson_id: l.id,
    completed_at: new Date(now.getTime() - (i + 1) * 2 * 86400000).toISOString(),
    lesson: l,
  }));

  return (
    <div data-school-skin className="min-h-screen relative z-10" style={{ backgroundColor: BG, color: FG }}>
      <CabinetBg />

      {/* preview banner (full width, above the shell) */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap', padding: '8px 18px',
          background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888' }}>
          Preview · дашборд целиком · боевой скин · демо-данные
        </span>
        <div className="flex items-center gap-3">
          <Link to="/school/ladder-preview" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#888' }}>Лестница →</Link>
          <Link to="/school/dashboard" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT }}>← Боевой</Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex flex-col sm:flex-row">
        {/* ==================== SIDEBAR (replica of the live <aside>) ==================== */}
        <aside
          className={`fixed sm:sticky top-0 left-0 h-full sm:h-screen z-50 flex flex-col flex-shrink-0 border-r transition-transform duration-300
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
          style={{ width: 248, borderColor: BORDER, backgroundColor: '#0a0a0a' }}
        >
          {/* logo + wordmark */}
          <div className="border-b flex items-center gap-3 p-4" style={{ borderColor: BORDER }}>
            <div style={{ width: 52, height: 52, overflow: 'hidden', borderRadius: 6, flexShrink: 0, backgroundColor: '#000' }}>
              <video src={logoVideo} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', color: FG, whiteSpace: 'nowrap' }}>
                TRADE<span style={{ color: ACCENT }}>LIKE</span>TYO
              </div>
            </div>
          </div>

          {/* nav: Главная */}
          <nav className="px-3 pt-4 pb-2">
            <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md" style={{ backgroundColor: '#141414', borderLeft: `2px solid ${ACCENT}`, fontFamily: MONO, fontSize: 12, color: FG }}>
              <HomeIcon size={14} style={{ color: ACCENT }} />
              <span>{t('sidebar_home')}</span>
            </div>
          </nav>

          {/* programs */}
          <div className="px-5 pt-4 pb-2">
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555' }}>{t('sidebar_programs_label')}</div>
          </div>
          <nav className="overflow-y-auto px-3 space-y-1 pb-4">
            {SIDEBAR_COURSES.map((c) => {
              const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
              return (
                <div key={c.title} className="w-full text-left rounded-md px-3 py-2.5" style={{ borderLeft: '2px solid transparent', opacity: c.locked ? 0.45 : 1 }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate" style={{ fontFamily: MONO, fontSize: 12, color: c.locked ? '#555' : FG }}>{c.title}</span>
                    {c.locked && <Lock size={11} style={{ color: '#444', flexShrink: 0 }} />}
                  </div>
                  {!c.locked && c.total > 0 && (
                    <div className="mt-2">
                      <div style={{ height: 3, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: ACCENT }} />
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: '#555', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{c.done}/{c.total}</div>
                    </div>
                  )}
                  {c.locked && <div style={{ fontFamily: MONO, fontSize: 9, color: '#444', marginTop: 4 }}>{t('sidebar_locked')}</div>}
                </div>
              );
            })}
          </nav>

          {/* profile */}
          <div className="border-t p-3 space-y-2 mt-auto" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', color: ACCENT, fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 18 }}>А</div>
              <div className="min-w-0 flex-1">
                <div className="truncate" style={{ fontFamily: SANS, fontSize: 12, color: FG }}>Александр Т.</div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: COOL, marginTop: 2 }}>{t('sidebar_status_active')}</div>
              </div>
              <Settings size={22} style={{ color: '#666' }} />
            </div>
            <div className="w-full flex items-center gap-2 px-3 py-2 rounded" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: '#666' }}>
              <LogOut size={13} /> {t('sidebar_signout')}
            </div>
          </div>
        </aside>

        {/* ==================== MAIN ==================== */}
        <main className="flex-1 min-h-screen flex flex-col">
          {/* top header (replica) */}
          <header className="sticky z-30 border-b" style={{ top: 37, borderColor: BORDER, backgroundColor: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setMobileOpen(true)} className="sm:hidden p-1.5"><Menu size={18} style={{ color: FG }} /></button>
                <span className="inline-block" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ACCENT, animation: 'tlyPulse 2.4s ease-out infinite' }} />
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888' }}>
                  {t('header_status_live')} · {t('header_status_suffix')}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-5">
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#666' }}>{now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}>{t('header_support')}</span>
              </div>
            </div>
          </header>

          {/* body — the REAL PaidHome on demo data */}
          <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10">
            <PaidHome
              welcomeTitle=""
              profileName="Александр Т."
              tmCourse={MAIN}
              tmLessons={MAIN_LESSONS}
              tmProgress={MAIN_PROGRESS}
              tmNextLesson={NEXT}
              programCountdown={countdown(programEnd, now)}
              programEnd={programEnd}
              daysInSystem={42}
              timeInSystem={null}
              isAdmin={false}
              upcomingLives={lives}
              liveCountdown={lives[0] ? countdown(lives[0], now) : null}
              recentActivity={recentActivity}
              courses={[MAIN, EXTRA]}
              progress={{ [MAIN.id]: MAIN_PROGRESS, [EXTRA.id]: { completed: 2, total: 6 } }}
              now={now}
              onOpenLesson={() => {}}
              onSelectCourse={() => {}}
              userId={undefined}
              t={t}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
