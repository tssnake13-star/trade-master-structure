import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Settings, LogOut, ArrowRight, Menu, Ticket, Home as HomeIcon, MessageCircle } from 'lucide-react';
import logoVideoFallback from '@/assets/logo-dashboard.mp4';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  is_free: boolean;
  sort_order: number;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface ProgressMap {
  [courseId: string]: { completed: number; total: number };
}

interface CompletionRecord {
  lesson_id: string;
  completed_at: string;
}

const ACCENT = '#caa472';
const BG = '#080808';
const FG = '#e8e0d0';
const CARD = '#0c0c0c';
const BORDER = '#1a1a1a';
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Inter', sans-serif";
const DISPLAY = "'Fraunces', Georgia, serif";

// Hero title with *italic accent* / ~muted~ markup
function renderHeroTitle(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*[^*]+\*|~[^~]+~)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(regex)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(<span key={i++} style={{ opacity: 0.55 }}>{text.slice(last, idx)}</span>);
    const token = m[0];
    if (token.startsWith('*')) {
      parts.push(<em key={i++} style={{ color: ACCENT, fontStyle: 'italic' }}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(<span key={i++} style={{ opacity: 0.55 }}>{token.slice(1, -1)}</span>);
    }
    last = idx + token.length;
  }
  if (last < text.length) parts.push(<span key={i++} style={{ opacity: 0.55 }}>{text.slice(last)}</span>);
  return parts.length ? parts : <span style={{ opacity: 0.55 }}>{text}</span>;
}

// ---------- helpers ----------
function nextLiveStream(now: Date) {
  // Mon (1) and Thu (4) at 20:00 GMT+5
  const offsetMinutes = -now.getTimezoneOffset(); // local offset
  const targetOffset = 5 * 60; // GMT+5
  const list: Date[] = [];
  const base = new Date(now.getTime());
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    // Get day-of-week in GMT+5
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const gmt5 = new Date(utc + targetOffset * 60000);
    const dow = gmt5.getDay(); // in GMT+5
    if (dow === 1 || dow === 4) {
      // 20:00 in GMT+5 → convert back to local
      const ts = Date.UTC(gmt5.getUTCFullYear(), gmt5.getUTCMonth(), gmt5.getUTCDate(), 20 - 5, 0, 0);
      const event = new Date(ts);
      if (event.getTime() > now.getTime()) list.push(event);
    }
  }
  return list.slice(0, 3);
}

function formatCountdown(target: Date, now: Date) {
  let diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return { d, h, m, s };
}

// Wall-clock-aligned ticker: fires at the start of each second so every
// countdown on the page advances on the exact same boundary.
function useNow(_intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timeoutId: number;
    const tick = () => {
      const n = new Date();
      setNow(n);
      const delay = 1000 - (n.getTime() % 1000);
      timeoutId = window.setTimeout(tick, delay);
    };
    const first = 1000 - (Date.now() % 1000);
    timeoutId = window.setTimeout(tick, first);
    return () => window.clearTimeout(timeoutId);
  }, []);
  return now;
}

// ---------- main component ----------
export default function SchoolDashboard() {
  const { session, user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState<Course[]>([]);
  const [accessMap, setAccessMap] = useState<Map<string, { courseId: string; unlocked: number[]; granted_at?: string | null; expires_at?: string | null }>>(new Map());
  const [progress, setProgress] = useState<ProgressMap>({});
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [welcomeTitle, setWelcomeTitle] = useState('Добро пожаловать в систему');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const logoVideo = useSiteAsset(SITE_ASSET_KEYS.schoolDashboardLogo, logoVideoFallback);
  const now = useNow(1000);

  // hasAccess needs role/accessMap — compute inline below as well
  const _hasAccessEarly = (c: Course) => role === 'admin' || c.is_free || accessMap.has(c.id);
  const _tmCourseEarly = courses.find(c => c.title === 'TRADE MASTER 4.5' && _hasAccessEarly(c)) || null;
  const _tmAccessEarly = _tmCourseEarly ? accessMap.get(_tmCourseEarly.id) : null;

  const programEnd = useMemo(() => {
    // Source of truth: course_access.expires_at (set by invite/admin).
    // Fallback: granted_at + 90 days for legacy records without an expiry.
    if (_tmAccessEarly?.expires_at) return new Date(_tmAccessEarly.expires_at);
    if (_tmAccessEarly?.granted_at) {
      const start = new Date(_tmAccessEarly.granted_at);
      return new Date(start.getTime() + 90 * 86400000);
    }
    return null;
  }, [_tmAccessEarly?.expires_at, _tmAccessEarly?.granted_at]);
  const daysInSystem = useMemo(() => {
    if (!_tmAccessEarly?.granted_at) return 0;
    const start = new Date(_tmAccessEarly.granted_at).getTime();
    return Math.max(0, Math.floor((now.getTime() - start) / 86400000));
  }, [_tmAccessEarly?.granted_at, now]);
  const upcomingLives = useMemo(() => nextLiveStream(now), [now]);
  const recentActivity = useMemo(() => {
    return [...completions]
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 5)
      .map(c => ({ ...c, lesson: allLessons.find(l => l.id === c.lesson_id) }))
      .filter(x => x.lesson);
  }, [completions, allLessons]);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [coursesRes, accessRes, lessonsRes, progressRes, profileRes, titleRes] = await Promise.all([
        supabase.from('courses').select('*').order('sort_order'),
        supabase.from('course_access').select('course_id, unlocked_lessons, granted_at, expires_at').eq('user_id', user.id),
        supabase.from('lessons').select('id, course_id, title, description, sort_order').order('sort_order'),
        supabase.from('lesson_progress').select('lesson_id, completed_at').eq('user_id', user.id),
        supabase.from('profiles').select('full_name, email').eq('user_id', user.id).single(),
        supabase.from('site_settings').select('value').eq('key', 'dashboard_welcome_title').single(),
      ]);

      if (titleRes.data?.value) setWelcomeTitle(titleRes.data.value);
      if (profileRes.data) {
        setProfileName(profileRes.data.full_name || '');
        setProfileEmail(profileRes.data.email || '');
      }

      const courseList = (coursesRes.data || []) as Course[];
      const accessData = (accessRes.data || []) as { course_id: string; unlocked_lessons: number[]; granted_at: string; expires_at: string | null }[];
      const accessSet = new Set(accessData.map(a => a.course_id));
      const aMap = new Map(accessData.map(a => [a.course_id, { courseId: a.course_id, unlocked: a.unlocked_lessons || [1], granted_at: a.granted_at, expires_at: a.expires_at }]));
      const lessons = (lessonsRes.data || []) as Lesson[];
      const completionList = (progressRes.data || []) as CompletionRecord[];
      const completedSet = new Set(completionList.map(p => p.lesson_id));

      setCourses(courseList);
      setAccessMap(aMap);
      setAllLessons(lessons);
      setCompletedIds(completedSet);
      setCompletions(completionList);

      const pm: ProgressMap = {};
      for (const c of courseList) {
        const courseLessons = lessons.filter(l => l.course_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
        const isAdmin = role === 'admin';
        let unlockedSortOrders: number[];
        if (isAdmin) unlockedSortOrders = courseLessons.map((_, i) => i + 1);
        else if (c.is_free) {
          unlockedSortOrders = [1];
          for (let i = 1; i < courseLessons.length; i++) {
            if (completedSet.has(courseLessons[i - 1].id)) unlockedSortOrders.push(i + 1);
            else break;
          }
        } else unlockedSortOrders = aMap.get(c.id)?.unlocked || [1];

        const unlockedLessons = courseLessons.filter((_, i) => unlockedSortOrders.includes(i + 1));
        const completedCount = unlockedLessons.filter(l => completedSet.has(l.id)).length;
        pm[c.id] = { completed: completedCount, total: courseLessons.length };
      }
      setProgress(pm);

      const canAccess = (c: Course) => role === 'admin' || c.is_free || accessSet.has(c.id);
      const stateId = (location.state as any)?.selectedCourse;
      if (stateId) {
        const fromState = courseList.find(c => c.id === stateId && canAccess(c));
        if (fromState) setSelectedCourse(fromState.id);
        window.history.replaceState({}, '');
      } else {
        setSelectedCourse(prev => {
          if (!prev) return null;
          const stillValid = courseList.find(c => c.id === prev && canAccess(c));
          return stillValid ? prev : null;
        });
      }
      setLoading(false);
    };
    load();
  }, [user, role, location.state]);

  if (authLoading || loading) {
    return (
      <div data-school-skin className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: FG }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666' }}>Загрузка</p>
      </div>
    );
  }

  const hasAccess = (c: Course) => role === 'admin' || c.is_free || accessMap.has(c.id);
  const hasPaidAccess = role === 'admin' || courses.some(c => !c.is_free && accessMap.has(c.id));
  const isFreeUser = !hasPaidAccess;

  const getCourseLessons = (courseId: string) =>
    allLessons.filter(l => l.course_id === courseId).sort((a, b) => a.sort_order - b.sort_order);

  const getUnlockedSortOrders = (course: Course, courseLessons: Lesson[]) => {
    if (role === 'admin') return courseLessons.map((_, i) => i + 1);
    if (course.is_free) {
      const unlocked: number[] = [1];
      for (let i = 1; i < courseLessons.length; i++) {
        if (completedIds.has(courseLessons[i - 1].id)) unlocked.push(i + 1);
        else break;
      }
      return unlocked;
    }
    return accessMap.get(course.id)?.unlocked || [1];
  };

  const getUnlockedLessons = (course: Course, courseLessons: Lesson[]) => {
    const u = getUnlockedSortOrders(course, courseLessons);
    return courseLessons.filter((_, i) => u.includes(i + 1));
  };

  const getFirstIncomplete = (course: Course, courseLessons: Lesson[]) => {
    // Только разблокированные незавершённые уроки могут быть "продолжить".
    // Заблокированные не возвращаем — иначе на дашборде появится "Продолжить занятие N",
    // которое студент открыть не может.
    const unlocked = getUnlockedLessons(course, courseLessons);
    return unlocked.find(l => !completedIds.has(l.id)) || null;
  };

  const selectCourse = (id: string | null) => {
    setSelectedCourse(id);
    setMobileSidebarOpen(false);
  };

  // -------- main course (TM 4.5 if available, else first paid course) --------
  const tmCourse = courses.find(c => c.title === 'TRADE MASTER 4.5' && hasAccess(c)) || null;
  const tmLessons = tmCourse ? getCourseLessons(tmCourse.id) : [];
  const tmProgress = tmCourse ? (progress[tmCourse.id] || { completed: 0, total: 0 }) : null;
  const tmNextLesson = tmCourse ? getFirstIncomplete(tmCourse, tmLessons) : null;
  const tmAccess = tmCourse ? accessMap.get(tmCourse.id) : null;

  // -------- end-of-program countdown: granted_at + 90d --------
  const programCountdown = programEnd ? formatCountdown(programEnd, now) : null;
  const liveCountdown = upcomingLives[0] ? formatCountdown(upcomingLives[0], now) : null;

  // -------- selected course detail (shown if selectedCourse set) --------
  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const selectedAccessible = selectedCourseData ? hasAccess(selectedCourseData) : false;
  const selectedLessons = selectedCourseData ? getCourseLessons(selectedCourseData.id) : [];
  const selectedUnlockedSortOrders = selectedCourseData ? getUnlockedSortOrders(selectedCourseData, selectedLessons) : [];
  const selectedUnlockedLessons = selectedCourseData ? getUnlockedLessons(selectedCourseData, selectedLessons) : [];
  const selectedNext = selectedCourseData ? getFirstIncomplete(selectedCourseData, selectedLessons) : null;
  const selectedProgress = selectedCourse ? (progress[selectedCourse] || { completed: 0, total: 0 }) : { completed: 0, total: 0 };
  const selectedPct = selectedProgress.total > 0 ? Math.round((selectedProgress.completed / selectedProgress.total) * 100) : 0;

  const initial = (profileName || profileEmail || '?').trim().charAt(0).toUpperCase();

  // ============= RENDER =============
  return (
    <div data-school-skin className="min-h-screen flex flex-col sm:flex-row" style={{ backgroundColor: BG, color: FG }}>
      {mobileSidebarOpen && (
        <div className="sm:hidden fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside
        className={`fixed sm:sticky top-0 left-0 h-full sm:h-screen z-50 flex flex-col flex-shrink-0 border-r transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 sm:sticky sm:top-0`}
        style={{ width: 248, borderColor: BORDER, backgroundColor: '#0a0a0a' }}
      >
        {/* Header — clickable, resets selection */}
        <button
          onClick={() => { selectCourse(null); setMobileSidebarOpen(false); }}
          className="border-b flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition"
          style={{ borderColor: BORDER }}
        >
          <div style={{ width: 52, height: 52, overflow: 'hidden', borderRadius: 6, flexShrink: 0, backgroundColor: '#000' }}>
            <video key={logoVideo} src={logoVideo} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: FG }}>
              TRADELIKETYO
            </div>
          </div>
        </button>

        {/* Nav: Главная */}
        <nav className="px-3 pt-4 pb-2">
          <button
            onClick={() => { selectCourse(null); setMobileSidebarOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition"
            style={{
              backgroundColor: selectedCourse === null ? '#141414' : 'transparent',
              borderLeft: selectedCourse === null ? `2px solid ${ACCENT}` : '2px solid transparent',
              fontFamily: MONO, fontSize: 12, color: FG,
            }}
          >
            <HomeIcon size={14} style={{ color: selectedCourse === null ? ACCENT : '#666' }} />
            <span>Главная</span>
          </button>
        </nav>

        {/* Programs */}
        <div className="px-5 pt-4 pb-2">
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555' }}>
            Программы
          </div>
        </div>
        <nav className="overflow-y-auto px-3 space-y-1 pb-4">
          {courses.map(c => {
            const accessible = hasAccess(c);
            const cp = progress[c.id] || { completed: 0, total: 0 };
            const cpct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
            const isSelected = selectedCourse === c.id;

            return (
              <button
                key={c.id}
                onClick={() => accessible && selectCourse(c.id)}
                disabled={!accessible}
                className="w-full text-left rounded-md px-3 py-2.5 transition-all"
                style={{
                  backgroundColor: isSelected ? '#141414' : 'transparent',
                  borderLeft: isSelected ? `2px solid ${ACCENT}` : '2px solid transparent',
                  opacity: accessible ? 1 : 0.45,
                  cursor: accessible ? 'pointer' : 'default',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate" style={{ fontFamily: MONO, fontSize: 12, color: accessible ? FG : '#555' }}>
                    {c.title}
                  </span>
                  {!accessible && <Lock size={11} style={{ color: '#444', flexShrink: 0 }} />}
                </div>
                {accessible && cp.total > 0 && (
                  <div className="mt-2">
                    <div style={{ height: 3, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${cpct}%`, height: '100%', backgroundColor: ACCENT, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: '#555', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                      {cp.completed}/{cp.total}
                    </div>
                  </div>
                )}
                {!accessible && (
                  <div style={{ fontFamily: MONO, fontSize: 9, color: '#444', marginTop: 4 }}>Закрыто</div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="border-t p-3 space-y-2" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                color: ACCENT, fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 18, fontWeight: 400,
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate" style={{ fontFamily: SANS, fontSize: 12, color: FG }}>
                {profileName || profileEmail || 'Студент'}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666', marginTop: 2 }}>
                {isFreeUser ? 'Вводный доступ' : 'Активный'}
              </div>
            </div>
            {role === 'admin' && (
              <button onClick={() => navigate('/school/admin')} className="p-1.5 hover:bg-white/5 rounded transition" title="Админ">
                <Settings size={18} style={{ color: '#666' }} />
              </button>
            )}
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs hover:bg-white/5 transition"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: '#666' }}
          >
            <LogOut size={13} /> Выйти
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 border-b"
          style={{
            borderColor: BORDER,
            backgroundColor: 'rgba(8,8,8,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileSidebarOpen(true)} className="sm:hidden p-1.5 hover:bg-white/5 rounded transition">
                <Menu size={18} style={{ color: FG }} />
              </button>
              <span className="inline-block" style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: isFreeUser ? '#888' : ACCENT,
                animation: isFreeUser ? 'none' : 'tlyPulse 2.4s ease-out infinite',
              }} />
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888' }}>
                {isFreeUser ? 'Вводный доступ' : 'Live'} · КАБИНЕТ ТРЕЙДЕРА
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-5">
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#666' }}>
                {now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <a
                href="http://t.me/tradeliketyo"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}
                className="hover:text-foreground transition"
              >
                Поддержка
              </a>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {/* ----- Selected course detail view ----- */}
          {selectedCourseData && selectedAccessible && (
            <SelectedCourseView
              course={selectedCourseData}
              lessons={selectedLessons}
              unlockedSortOrders={selectedUnlockedSortOrders}
              completedIds={completedIds}
              progress={selectedProgress}
              pct={selectedPct}
              nextLesson={selectedNext}
              onOpen={(id) => navigate(`/school/lesson/${id}`)}
            />
          )}

          {selectedCourseData && !selectedAccessible && (
            <div className="flex flex-col items-center justify-center py-24">
              <Lock size={28} style={{ color: '#333' }} className="mb-4" />
              <p style={{ fontFamily: MONO, fontSize: 12, color: '#555' }}>Программа закрыта</p>
            </div>
          )}

          {/* ----- Home view ----- */}
          {!selectedCourse && !isFreeUser && (
            <PaidHome
              welcomeTitle={welcomeTitle}
              profileName={profileName}
              tmCourse={tmCourse}
              tmLessons={tmLessons}
              tmProgress={tmProgress}
              tmNextLesson={tmNextLesson}
              programCountdown={programCountdown}
              daysInSystem={daysInSystem}
              upcomingLives={upcomingLives}
              liveCountdown={liveCountdown}
              recentActivity={recentActivity}
              courses={courses.filter(c => hasAccess(c))}
              progress={progress}
              now={now}
              onOpenLesson={(id) => navigate(`/school/lesson/${id}`)}
              onSelectCourse={selectCourse}
              userId={user?.id}
            />
          )}

          {!selectedCourse && isFreeUser && (
            <FreeHome
              courses={courses}
              progress={progress}
              accessMap={accessMap}
              hasAccess={hasAccess}
              role={role}
              completedIds={completedIds}
              getCourseLessons={getCourseLessons}
              getUnlockedLessons={getUnlockedLessons}
              getFirstIncomplete={getFirstIncomplete}
              upcomingLives={upcomingLives}
              liveCountdown={liveCountdown}
              now={now}
              onOpenLesson={(id) => navigate(`/school/lesson/${id}`)}
              onSelectCourse={selectCourse}
              userId={user?.id}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="border-t px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderColor: BORDER }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#555' }}>
            © TRADELIKETYO · 2026
          </span>
          <a
            href="https://t.me/rav_999"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666' }}
            className="hover:text-foreground transition"
          >
            Telegram автора
          </a>
        </footer>
      </main>
    </div>
  );
}

// ====================================================================
//   SELECTED COURSE DETAIL
// ====================================================================
function SelectedCourseView({
  course, lessons, unlockedSortOrders, completedIds, progress, pct, nextLesson, onOpen,
}: {
  course: Course;
  lessons: Lesson[];
  unlockedSortOrders: number[];
  completedIds: Set<string>;
  progress: { completed: number; total: number };
  pct: number;
  nextLesson: Lesson | null;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="mb-8">
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, marginBottom: 14 }}>
          ◆ Программа
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: FG }}>
          {course.title}
        </h1>
        {course.subtitle && (
          <p className="mt-3" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#a8a090', maxWidth: '60ch' }}>
            {course.subtitle}
          </p>
        )}
        {progress.total > 0 && (
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1" style={{ height: 2, backgroundColor: BORDER, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: ACCENT, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#666', fontVariantNumeric: 'tabular-nums' }}>
              {progress.completed}/{progress.total} · {pct}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {lessons.map((l, i) => {
          const done = completedIds.has(l.id);
          const unlocked = unlockedSortOrders.includes(i + 1);
          return (
            <div
              key={l.id}
              className="flex items-start gap-3 px-0 sm:px-2 py-3 transition-all"
              style={{
                borderTop: i === 0 ? `1px solid ${BORDER}` : 'none',
                borderBottom: `1px solid ${BORDER}`,
                opacity: unlocked ? 1 : 0.45,
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36, height: 36,
                  border: `1px solid ${done ? ACCENT : BORDER}`,
                  backgroundColor: done ? `${ACCENT}11` : 'transparent',
                  color: done ? ACCENT : (unlocked ? '#888' : '#444'),
                  fontFamily: MONO, fontSize: 12, fontVariantNumeric: 'tabular-nums',
                }}
              >
                {done ? '✓' : !unlocked ? <Lock size={12} /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 500,
                    color: unlocked ? FG : '#555',
                    lineHeight: 1.35,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {l.title}
                </div>
              </div>
              {!unlocked ? (
                <span className="flex-shrink-0 pt-1" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#444' }}>
                  Закрыто
                </span>
              ) : done ? (
                <button onClick={() => onOpen(l.id)} className="flex-shrink-0 pt-1 hover:opacity-70 transition" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT }}>
                  Повторить →
                </button>
              ) : (
                <button
                  onClick={() => onOpen(l.id)}
                  className="flex-shrink-0"
                  style={{
                    fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500,
                    backgroundColor: ACCENT, color: '#0a0a0a',
                    padding: '8px 16px', borderRadius: 6,
                  }}
                >
                  Открыть
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ====================================================================
//   PAID HOME
// ====================================================================
function PaidHome({
  welcomeTitle, profileName, tmCourse, tmLessons, tmProgress, tmNextLesson,
  programCountdown, daysInSystem, upcomingLives, liveCountdown, recentActivity,
  courses, progress, now, onOpenLesson, onSelectCourse, userId,
}: {
  welcomeTitle: string;
  profileName: string;
  tmCourse: Course | null;
  tmLessons: Lesson[];
  tmProgress: { completed: number; total: number } | null;
  tmNextLesson: Lesson | null;
  programCountdown: { d: number; h: number; m: number; s: number } | null;
  daysInSystem: number;
  upcomingLives: Date[];
  liveCountdown: { d: number; h: number; m: number; s: number } | null;
  recentActivity: { lesson_id: string; completed_at: string; lesson?: Lesson }[];
  courses: Course[];
  progress: ProgressMap;
  now: Date;
  onOpenLesson: (id: string) => void;
  onSelectCourse: (id: string) => void;
  userId?: string;
}) {
  const greetingName = profileName ? profileName.split(' ')[0] : 'Трейдер';
  const heroText = `${greetingName}, *система* ждёт вас.`;
  const remaining = tmProgress ? Math.max(0, tmProgress.total - tmProgress.completed) : 0;
  const completed = tmProgress?.completed ?? 0;

  return (
    <>
      {/* Hero */}
      <div className="mb-12">
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 14 }}>
          С возвращением
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(38px, 5.5vw, 64px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: FG }}>
          {renderHeroTitle(heroText)}
        </h1>
        <p className="mt-4" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#a8a090', maxWidth: '52ch' }}>
          {(() => {
            const t = (welcomeTitle || '').replace(/[*~]/g, '').trim();
            const isDefault = !t || /добро пожаловать/i.test(t);
            return isDefault ? 'Программа открыта. Соблюдайте регламент — он работает за вас.' : t;
          })()}
        </p>
      </div>

      {/* KPI strip */}
      <div className="mb-10 grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ backgroundColor: BORDER, border: `1px solid ${BORDER}` }}>
        <KpiCell label="День в системе" value={String(daysInSystem)} />
        <KpiCell label="Осталось уроков" value={String(remaining)} />
        <KpiCell label="Завершено уроков" value={String(completed)} />
        <KpiCell
          label="До завершения обучения"
          value={programCountdown ? `${programCountdown.d}д ${String(programCountdown.h).padStart(2,'0')}:${String(programCountdown.m).padStart(2,'0')}:${String(programCountdown.s).padStart(2,'0')}` : '—'}
          accent
          pulse
          mono
        />
      </div>

      {/* Continue + Live grid */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Continue card 2/3 */}
        <button
          onClick={() => tmNextLesson && onOpenLesson(tmNextLesson.id)}
          disabled={!tmNextLesson}
          className="lg:col-span-2 text-left p-7 transition-all hover:border-[#2a2a2a] group relative overflow-hidden"
          style={{
            border: `1px solid ${BORDER}`,
            backgroundColor: CARD,
            borderRadius: 10,
            background: `radial-gradient(circle at 0% 0%, ${ACCENT}22 0%, ${CARD} 60%)`,
          }}
        >
          {tmNextLesson && tmCourse ? (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
                Продолжить · занятие {tmLessons.indexOf(tmNextLesson) + 1}
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, lineHeight: 1.2, color: FG, marginBottom: 8 }}>
                {tmNextLesson.title}
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex gap-4" style={{ fontFamily: MONO, fontSize: 11, color: '#666' }}>
                  <span>● Видео</span>
                  <span>● PDF</span>
                </div>
                <div className="flex items-center gap-2 transition-transform group-hover:translate-x-1" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>
                  Открыть <ArrowRight size={14} />
                </div>
              </div>
            </>
          ) : (
            <div>
              {remaining > 0 ? (
                <>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
                    Ожидает открытия
                  </div>
                  <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, color: FG }}>
                    Следующее занятие откроет наставник
                  </h2>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
                    Программа завершена
                  </div>
                  <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, color: FG }}>
                    Все занятия пройдены ✓
                  </h2>
                </>
              )}
            </div>
          )}
        </button>

        {/* Live card 1/3 */}
        <LiveStreamsCard upcoming={upcomingLives} countdown={liveCountdown} now={now} />
      </div>

      {/* Programs grid */}
      <div className="mb-12">
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555', marginBottom: 16 }}>
          Программы
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(c => {
            const cp = progress[c.id] || { completed: 0, total: 0 };
            const cpct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCourse(c.id)}
                className="text-left p-5 transition-all hover:border-[#2a2a2a]"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 8 }}
              >
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
                  Программа
                </div>
                <h3 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, color: FG, marginBottom: 6 }}>
                  {c.title}
                </h3>
                {c.subtitle && (
                  <p style={{ fontFamily: SANS, fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: 14 }} className="line-clamp-2">
                    {c.subtitle}
                  </p>
                )}
                {cp.total > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1" style={{ height: 2, backgroundColor: BORDER, overflow: 'hidden' }}>
                      <div style={{ width: `${cpct}%`, height: '100%', backgroundColor: ACCENT }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: '#666', fontVariantNumeric: 'tabular-nums' }}>
                      {cp.completed}/{cp.total}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity + Code */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 p-6" style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555', marginBottom: 16 }}>
            Последняя активность
          </div>
          {recentActivity.length === 0 ? (
            <p style={{ fontFamily: MONO, fontSize: 12, color: '#666' }}>Пока пусто</p>
          ) : (
            <div>
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-3" style={{ borderTop: i > 0 ? `1px solid #141414` : 'none' }}>
                  <span style={{ color: ACCENT, fontFamily: MONO, fontSize: 12 }}>✓</span>
                  <span className="flex-1 truncate" style={{ fontFamily: SANS, fontSize: 13, color: FG }}>
                    {a.lesson?.title}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: '#666', flexShrink: 0 }}>
                    {new Date(a.completed_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <ActivateCodeSection userId={userId} onActivated={() => window.location.reload()} compact />
        </div>
      </div>
    </>
  );
}

// ====================================================================
//   FREE HOME
// ====================================================================
function FreeHome({
  courses, progress, accessMap, hasAccess, role, completedIds,
  getCourseLessons, getUnlockedLessons, getFirstIncomplete,
  upcomingLives, liveCountdown, now, onOpenLesson, onSelectCourse, userId,
}: {
  courses: Course[];
  progress: ProgressMap;
  accessMap: Map<string, any>;
  hasAccess: (c: Course) => boolean;
  role: string | null;
  completedIds: Set<string>;
  getCourseLessons: (id: string) => Lesson[];
  getUnlockedLessons: (c: Course, l: Lesson[]) => Lesson[];
  getFirstIncomplete: (c: Course, l: Lesson[]) => Lesson | null;
  upcomingLives: Date[];
  liveCountdown: { d: number; h: number; m: number; s: number } | null;
  now: Date;
  onOpenLesson: (id: string) => void;
  onSelectCourse: (id: string) => void;
  userId?: string;
}) {
  const freeCourse = courses.find(c => c.is_free) || null;
  const freeLessons = freeCourse ? getCourseLessons(freeCourse.id) : [];
  const freeUnlocked = freeCourse ? getUnlockedLessons(freeCourse, freeLessons) : [];
  const freeProgress = freeCourse ? (progress[freeCourse.id] || { completed: 0, total: 0 }) : null;
  const freeNext = freeCourse ? getFirstIncomplete(freeCourse, freeLessons) : null;
  const completed = freeProgress?.completed ?? 0;
  const total = freeProgress?.total ?? 0;
  const completedAll = total > 0 && completed >= total;

  // Locked paid courses
  const lockedPaid = courses.filter(c => !c.is_free && !hasAccess(c));

  // Largest paid program total for the locked KPI cell
  const mainPaid = courses.find(c => c.title === 'TRADE MASTER 4.5') || courses.find(c => !c.is_free) || null;
  const mainPaidTotal = mainPaid ? getCourseLessons(mainPaid.id).length : 0;

  const lockedLabelFor = (c: Course) => {
    if (c.title.toLowerCase().includes('master')) return 'Допуск через куратора';
    if (c.title.toLowerCase().includes('elite') || c.title.toLowerCase().includes('vip')) return 'По приглашению';
    return 'После TM 4.5';
  };

  return (
    <>
      {/* Hero */}
      <div className="mb-12">
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(38px, 5.5vw, 64px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: FG }}>
          {renderHeroTitle('Добро пожаловать в *систему*.')}
        </h1>
        <p className="mt-4" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#a8a090', maxWidth: '60ch' }}>
          Вы получили доступ к {total || 'нескольким'} вводным занятиям TLT. Они показывают, как устроена система. Основная программа TRADE MASTER 4.5 открывается по коду доступа от администратора.
        </p>
      </div>

      {/* KPI strip — 2 cells */}
      <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ backgroundColor: BORDER, border: `1px solid ${BORDER}` }}>
        <div className="p-6" style={{ backgroundColor: BG }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555', marginBottom: 14 }}>
            Вводный курс
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 32, lineHeight: 1, color: FG, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
            {completed}<span style={{ color: '#666', fontSize: 22 }}> / {total}</span>
          </div>
          {total > 0 && (
            <div style={{ height: 2, backgroundColor: BORDER, overflow: 'hidden' }}>
              <div style={{ width: `${(completed / total) * 100}%`, height: '100%', backgroundColor: ACCENT }} />
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col justify-between" style={{ backgroundColor: BG }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555', marginBottom: 14 }}>
            Основная программа
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, color: '#666', marginBottom: 8 }}>
              {mainPaidTotal} занятий · TM 4.5
            </div>
            <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666' }}>
              <Lock size={11} /> Закрыто · нужен код
            </div>
          </div>
        </div>
      </div>

      {/* Main card + live */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {completed === 0 && freeNext && freeCourse ? (
            <div
              className="p-7 relative overflow-hidden"
              style={{
                border: `1px solid ${ACCENT}66`,
                background: 'linear-gradient(135deg, #1a1408 0%, #0f0d08 60%)',
                borderRadius: 10,
              }}
            >
              <div aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle, ${ACCENT}44, transparent 70%)`, pointerEvents: 'none' }} />
              <div className="flex items-center gap-2 mb-3" style={{ position: 'relative' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ACCENT, display: 'inline-block', animation: 'tlyPulse 2.4s ease-out infinite' }} />
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT }}>
                  Доступ открыт · начните здесь
                </span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 28, lineHeight: 1.1, color: FG, marginBottom: 14, letterSpacing: '-0.02em', position: 'relative' }}>
                Допуск получают <em style={{ color: ACCENT, fontStyle: 'italic' }}>не все</em>. Начните с первого занятия.
              </h2>
              <p style={{ fontFamily: SANS, fontSize: 14, color: '#a8a090', lineHeight: 1.55, marginBottom: 22, maxWidth: '52ch', position: 'relative' }}>
                Это вводная программа. Она показывает, как устроены правила. Если поймёте — будет основная.
              </p>
              <button
                onClick={() => onOpenLesson(freeNext.id)}
                style={{
                  fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
                  backgroundColor: ACCENT, color: '#0a0a0a',
                  padding: '14px 24px', borderRadius: 8, position: 'relative',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}
              >
                Перейти к занятию 1 <ArrowRight size={14} />
              </button>
            </div>
          ) : !completedAll && freeNext ? (
            <button
              onClick={() => onOpenLesson(freeNext.id)}
              className="w-full text-left p-6 transition-all hover:border-[#2a2a2a] group"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 10 }}
            >
              {total > 0 && (
                <div style={{ height: 2, backgroundColor: BORDER, marginBottom: 18, overflow: 'hidden' }}>
                  <div style={{ width: `${(completed / total) * 100}%`, height: '100%', backgroundColor: ACCENT }} />
                </div>
              )}
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 10 }}>
                Продолжить · занятие {freeLessons.indexOf(freeNext) + 1}
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, color: FG, marginBottom: 8 }}>
                {freeNext.title}
              </h2>
              <div className="flex items-center gap-2 transition-transform group-hover:translate-x-1" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>
                Открыть <ArrowRight size={14} />
              </div>
            </button>
          ) : (
            <div className="p-7" style={{ border: `1px solid ${ACCENT}66`, background: 'linear-gradient(135deg, #1a1408 0%, #0f0d08 60%)', borderRadius: 10 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
                ◆ Готовы к следующему шагу
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 28, lineHeight: 1.1, color: FG, marginBottom: 14 }}>
                Вы готовы к <em style={{ color: ACCENT, fontStyle: 'italic' }}>основной</em> программе.
              </h2>
              <p style={{ fontFamily: SANS, fontSize: 14, color: '#a8a090', lineHeight: 1.55, marginBottom: 22, maxWidth: '52ch' }}>
                Свяжитесь с автором — он подскажет как получить доступ.
              </p>
              <a
                href="https://t.me/rav_999"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
                  backgroundColor: ACCENT, color: '#0a0a0a',
                  padding: '14px 24px', borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}
              >
                <MessageCircle size={14} /> Написать Сергею
              </a>
            </div>
          )}
        </div>

        <LiveStreamsCard upcoming={upcomingLives} countdown={liveCountdown} now={now} />
      </div>

      {/* Locked paid programs */}
      {lockedPaid.length > 0 && (
        <div className="mb-12">
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555', marginBottom: 16 }}>
            Программы по допуску
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedPaid.map(c => (
              <div
                key={c.id}
                className="p-5"
                style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 8, opacity: 0.55 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#666' }}>
                    Программа
                  </div>
                  <Lock size={12} style={{ color: '#555' }} />
                </div>
                <h3 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 20, color: FG, marginBottom: 6 }}>
                  {c.title}
                </h3>
                {c.subtitle && (
                  <p style={{ fontFamily: SANS, fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 12 }} className="line-clamp-2">
                    {c.subtitle}
                  </p>
                )}
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT }}>
                  {lockedLabelFor(c)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code section */}
      <ActivateCodeSection userId={userId} onActivated={() => window.location.reload()} />
    </>
  );
}

// ====================================================================
//   SUB COMPONENTS
// ====================================================================
function KpiCell({ label, value, accent, pulse, mono }: { label: string; value: string; accent?: boolean; pulse?: boolean; mono?: boolean }) {
  return (
    <div className="p-5 sm:p-6" style={{ backgroundColor: BG }}>
      <div className="flex items-center gap-2 mb-3">
        {pulse && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: ACCENT, animation: 'tlyPulse 2.4s ease-out infinite' }} />}
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#555' }}>
          {label}
        </div>
      </div>
      <div style={{
        fontFamily: mono ? MONO : DISPLAY,
        fontWeight: mono ? 500 : 350,
        fontSize: mono ? 18 : 32,
        lineHeight: 1,
        color: accent ? ACCENT : FG,
        letterSpacing: mono ? '0.02em' : '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

function LiveStreamsCard({ upcoming, countdown, now }: { upcoming: Date[]; countdown: { d: number; h: number; m: number; s: number } | null; now: Date }) {
  return (
    <div className="p-6" style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 10 }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: ACCENT, animation: 'tlyPulse 2.4s ease-out infinite' }} />
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT }}>
          Прямые эфиры
        </div>
      </div>

      {countdown && (
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { v: countdown.d, l: 'д' },
            { v: countdown.h, l: 'ч' },
            { v: countdown.m, l: 'м' },
            { v: countdown.s, l: 'с' },
          ].map((x, i) => (
            <div key={i} className="text-center">
              <div style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 22, lineHeight: 1, color: FG, fontVariantNumeric: 'tabular-nums' }}>
                {String(x.v).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#666', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                {x.l}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 mb-5">
        {upcoming.map((d, i) => {
          const isNext = i === 0;
          const dow = d.toLocaleDateString('ru-RU', { weekday: 'short' });
          const day = d.getDate();
          const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderTop: i > 0 ? `1px solid #141414` : 'none' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 350, color: isNext ? ACCENT : FG, minWidth: 30, textAlign: 'center' }}>
                {day}
              </div>
              <div className="flex-1">
                <div style={{ fontFamily: MONO, fontSize: 11, color: isNext ? FG : '#888', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {dow} · {time}
                </div>
              </div>
              {isNext && (
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT, padding: '2px 8px', border: `1px solid ${ACCENT}66`, borderRadius: 4 }}>
                  Скоро
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: SANS, fontSize: 12, color: '#888', lineHeight: 1.5 }}>
        Эфир в группе{' '}
        <span style={{ color: ACCENT }}>Telegram</span>{' '}/{' '}
        <span style={{ color: ACCENT }}>YouTube</span>
      </p>
    </div>
  );
}

function ActivateCodeSection({ userId, onActivated, compact }: { userId?: string; onActivated: () => void; compact?: boolean }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const activate = async () => {
    if (!code.trim() || !userId) return;
    setLoading(true);
    setMessage(null);
    try {
      const { data: isValid, error: err } = await supabase.rpc('validate_invite_code', { _code: code.trim() });
      if (err) throw err;
      if (!isValid) {
        setMessage({ text: 'Код недействителен или уже использован', success: false });
        setLoading(false);
        return;
      }
      await supabase.rpc('use_invite_code', { _code: code.trim(), _user_id: userId });
      setMessage({ text: 'Доступ открыт', success: true });
      setCode('');
      setTimeout(onActivated, 1500);
    } catch {
      setMessage({ text: 'Произошла ошибка', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col" style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 8 }}>
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={14} style={{ color: ACCENT }} />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT }}>
          Код доступа
        </span>
      </div>
      <p style={{ fontFamily: SANS, fontSize: 12, color: '#888', lineHeight: 1.55, marginBottom: 14 }}>
        {compact ? 'Получили код? Откройте программу.' : 'Получили код доступа? Введите его, чтобы открыть основную программу.'}
      </p>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Введите код"
          className="flex-1 px-3 py-2.5"
          style={{ backgroundColor: '#0a0a0a', border: `1px solid #1f1f1f`, borderRadius: 6, color: FG, fontFamily: MONO, fontSize: 12 }}
          onKeyDown={e => e.key === 'Enter' && activate()}
        />
        <button
          onClick={activate}
          disabled={loading || !code.trim()}
          style={{
            backgroundColor: ACCENT, color: '#0a0a0a',
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500,
            padding: '0 18px', borderRadius: 6, opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : 'Открыть'}
        </button>
      </div>
      {message && (
        <p style={{ fontFamily: MONO, fontSize: 11, color: message.success ? ACCENT : '#e85d3a', marginTop: 6 }}>
          {message.text}
        </p>
      )}
      <a
        href="https://t.me/rav_999"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto pt-3 hover:opacity-80 transition"
        style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}
      >
        Нет кода? → Написать Сергею
      </a>
    </div>
  );
}
