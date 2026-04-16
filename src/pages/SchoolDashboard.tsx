import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Settings, LogOut, ArrowRight, CheckCircle, Menu, Ticket } from 'lucide-react';
import logoVideo from '@/assets/logo-dashboard.mp4';

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

const font = { heading: "'Inter', sans-serif", mono: "'Inter', sans-serif" };

export default function SchoolDashboard() {
  const { session, user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [accessMap, setAccessMap] = useState<Map<string, { courseId: string; unlocked: number[] }>>(new Map());
  const [progress, setProgress] = useState<ProgressMap>({});
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [coursesRes, accessRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('*').order('sort_order'),
        supabase.from('course_access').select('course_id, unlocked_lessons').eq('user_id', user.id),
        supabase.from('lessons').select('id, course_id, title, description, sort_order').order('sort_order'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
      ]);

      const courseList = (coursesRes.data || []) as Course[];
      const accessData = (accessRes.data || []) as { course_id: string; unlocked_lessons: number[] }[];
      const accessSet = new Set(accessData.map((a) => a.course_id));
      const aMap = new Map(accessData.map((a) => [a.course_id, { courseId: a.course_id, unlocked: a.unlocked_lessons || [1] }]));
      const lessons = (lessonsRes.data || []) as Lesson[];
      const completedSet = new Set((progressRes.data || []).map((p) => p.lesson_id));

      setCourses(courseList);
      setAccessMap(aMap);
      setAllLessons(lessons);
      setCompletedIds(completedSet);

      const pm: ProgressMap = {};

      for (const c of courseList) {
        const courseLessons = lessons.filter((l) => l.course_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
        const isAdmin = role === 'admin';
        const unlockedSortOrders = isAdmin || c.is_free
          ? courseLessons.map((_, i) => i + 1)
          : (aMap.get(c.id)?.unlocked || [1]);
        const unlockedLessons = courseLessons.filter((_, i) => unlockedSortOrders.includes(i + 1));
        const completedUnlockedCount = unlockedLessons.filter((l) => completedSet.has(l.id)).length;

        // Progress bar: completed unlocked / total lessons in course
        // Completion check uses unlockedLessons.length (done elsewhere)
        pm[c.id] = {
          completed: completedUnlockedCount,
          total: courseLessons.length,
        };
      }

      setProgress(pm);

      const canAccess = (c: Course) => role === 'admin' || c.is_free || accessSet.has(c.id);
      const stateId = (location.state as any)?.selectedCourse;
      if (stateId) {
        const fromState = courseList.find((c) => c.id === stateId && canAccess(c));
        if (fromState) setSelectedCourse(fromState.id);
        window.history.replaceState({}, '');
      } else {
        setSelectedCourse(null);
      }

      setLoading(false);
    };

    load();
  }, [user, role, location.state]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  const hasAccess = (c: Course) => role === 'admin' || c.is_free || accessMap.has(c.id);

  const getCourseLessons = (courseId: string) =>
    allLessons.filter((l) => l.course_id === courseId).sort((a, b) => a.sort_order - b.sort_order);

  const getUnlockedSortOrders = (course: Course, courseLessons: Lesson[]) => {
    if (role === 'admin' || course.is_free) {
      return courseLessons.map((_, i) => i + 1);
    }
    return accessMap.get(course.id)?.unlocked || [1];
  };

  const getUnlockedLessons = (course: Course, courseLessons: Lesson[]) => {
    const unlockedSortOrders = getUnlockedSortOrders(course, courseLessons);
    return courseLessons.filter((_, i) => unlockedSortOrders.includes(i + 1));
  };

  const getCompletedUnlockedCount = (course: Course, courseLessons: Lesson[]) => {
    const unlockedLessons = getUnlockedLessons(course, courseLessons);
    return unlockedLessons.filter((lesson) => completedIds.has(lesson.id)).length;
  };

  const getFirstUnlockedIncompleteLesson = (course: Course, courseLessons: Lesson[]) => {
    const unlockedLessons = getUnlockedLessons(course, courseLessons);
    return unlockedLessons.find((lesson) => !completedIds.has(lesson.id)) || null;
  };

  const selectCourse = (id: string | null) => {
    setSelectedCourse(id);
    setMobileSidebarOpen(false);
  };

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);
  const selectedAccessible = selectedCourseData ? hasAccess(selectedCourseData) : false;
  const selectedLessons = selectedCourseData ? getCourseLessons(selectedCourseData.id) : [];
  const selectedUnlockedSortOrders = selectedCourseData ? getUnlockedSortOrders(selectedCourseData, selectedLessons) : [];
  const selectedUnlockedLessons = selectedCourseData ? getUnlockedLessons(selectedCourseData, selectedLessons) : [];
  const selectedCompletedUnlockedCount = selectedCourseData ? getCompletedUnlockedCount(selectedCourseData, selectedLessons) : 0;
  const nextLesson = selectedCourseData ? getFirstUnlockedIncompleteLesson(selectedCourseData, selectedLessons) : null;

  // "All completed" only when every lesson in the course is unlocked AND completed
  const allCompleted = selectedAccessible
    && selectedLessons.length > 0
    && selectedUnlockedLessons.length >= selectedLessons.length
    && selectedCompletedUnlockedCount >= selectedLessons.length;

  const p = selectedCourse ? (progress[selectedCourse] || { completed: 0, total: 0 }) : { completed: 0, total: 0 };
  const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col sm:flex-row" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      {mobileSidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed sm:relative top-0 left-0 h-full z-50
          flex flex-col w-64 flex-shrink-0 border-r
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
        `}
        style={{ borderColor: '#1a1a1a', backgroundColor: '#0a0a0a' }}
      >
        <div className="border-b cursor-pointer relative overflow-hidden" style={{ borderColor: '#1a1a1a' }} onClick={() => selectCourse(null)}>
          <video src={logoVideo} autoPlay loop muted playsInline className="w-full object-cover block" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {courses.map((c) => {
            const accessible = hasAccess(c);
            const cp = progress[c.id] || { completed: 0, total: 0 };
            const cpct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
            const isSelected = selectedCourse === c.id;

            return (
              <button
                key={c.id}
                onClick={() => accessible && selectCourse(c.id)}
                className="w-full text-left rounded-lg px-3 py-2.5 transition-all"
                style={{
                  backgroundColor: isSelected ? '#141414' : 'transparent',
                  borderLeft: isSelected ? '2px solid #4a8a4a' : '2px solid transparent',
                  opacity: accessible ? 1 : 0.5,
                  cursor: accessible ? 'pointer' : 'default',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate" style={{ fontFamily: font.mono, color: accessible ? '#e8e0d0' : '#555' }}>
                    {c.title}
                  </span>
                  {!accessible && <Lock size={12} style={{ color: '#444' }} />}
                </div>
                {accessible && cp.total > 0 && c.title === 'TRADE MASTER 4.5' && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                      <div className="h-full rounded-full" style={{ width: `${cpct}%`, backgroundColor: '#4a8a4a' }} />
                    </div>
                    <span className="text-[10px] mt-0.5 block" style={{ color: '#555', fontFamily: font.mono }}>
                      {cp.completed}/{cp.total} занятий
                    </span>
                  </div>
                )}
                {!accessible && (
                  <span className="text-[10px] mt-0.5 block" style={{ color: '#444', fontFamily: font.mono }}>
                    Закрыто
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-1" style={{ borderColor: '#1a1a1a' }}>
          {role === 'admin' && (
            <button
              onClick={() => navigate('/school/admin')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition"
              style={{ fontFamily: font.mono, color: '#4a8a4a' }}
            >
              <Settings size={14} /> Админ-панель
            </button>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition"
            style={{ fontFamily: font.mono, color: '#666' }}
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <header className="sm:hidden border-b px-3 py-3 flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 hover:bg-white/5 rounded-lg transition">
            <Menu size={20} style={{ color: '#e8e0d0' }} />
          </button>
          <div className="cursor-pointer" onClick={() => { selectCourse(null); navigate('/school/dashboard'); }}>
            <video src={logoVideo} autoPlay loop muted playsInline className="w-9 h-9 rounded-lg object-cover" />
          </div>
          <div className="flex items-center gap-1">
            {role === 'admin' && (
              <button onClick={() => navigate('/school/admin')} className="p-2 hover:bg-white/5 rounded-lg transition">
                <Settings size={16} style={{ color: '#4a8a4a' }} />
              </button>
            )}
            <button onClick={signOut} className="p-2 hover:bg-white/5 rounded-lg transition">
              <LogOut size={16} style={{ color: '#666' }} />
            </button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 sm:p-8">
          {selectedCourseData && selectedAccessible && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: font.heading }}>
                  {selectedCourseData.title}
                </h1>
                {selectedCourseData.subtitle && (
                  <p className="text-sm mb-3" style={{ color: '#666', fontFamily: font.mono }}>{selectedCourseData.subtitle}</p>
                )}
                {selectedCourseData.title === 'TRADE MASTER 4.5' && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }} />
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: '#666', fontFamily: font.mono }}>
                      {p.completed}/{p.total} · {pct}%
                    </span>
                  </div>
                )}
              </div>

              {!allCompleted && (() => {
                // If there's an incomplete unlocked lesson, point to it; otherwise point to the first unlocked lesson for review
                const target = nextLesson || (selectedUnlockedLessons.length > 0 ? selectedUnlockedLessons[0] : null);
                if (!target) return null;
                return (
                  <button
                    onClick={() => navigate(`/school/lesson/${target.id}`)}
                    className="w-full rounded-xl border p-4 mb-6 flex items-center justify-between transition-all hover:border-[#2a2a2a]"
                    style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}
                  >
                    <div className="text-left min-w-0">
                      <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                        {p.completed === 0 ? 'Начать' : 'Продолжить'}
                      </p>
                      <p className="text-sm truncate" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>
                        Занятие {selectedLessons.indexOf(target) + 1}. {target.title}
                      </p>
                    </div>
                    <ArrowRight size={16} style={{ color: '#4a8a4a' }} className="flex-shrink-0 ml-3" />
                  </button>
                );
              })()}

              <div className="space-y-1">
                {selectedLessons.map((l, i) => {
                  const done = completedIds.has(l.id);
                  const unlocked = selectedUnlockedSortOrders.includes(i + 1);
                  return (
                    <div
                      key={l.id}
                      onClick={() => unlocked && navigate(`/school/lesson/${l.id}`)}
                      className="rounded-lg px-4 py-3 flex items-start gap-3 transition-all"
                      style={{ opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'default' }}
                    >
                      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: done ? '#4a8a4a' : '#555', fontFamily: font.mono, minWidth: '1.5rem' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm block" style={{ fontFamily: font.mono, color: unlocked ? (done ? '#666' : '#e8e0d0') : '#444' }}>
                          {l.title}
                        </span>
                        {l.description && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: unlocked ? '#555' : '#333', fontFamily: font.mono }}>
                            {l.description}
                          </p>
                        )}
                      </div>
                      {!unlocked ? (
                        <Lock size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#333' }} />
                      ) : done ? (
                        <button
                          onClick={() => navigate(`/school/lesson/${l.id}`)}
                          className="flex-shrink-0 flex items-center gap-1 text-xs py-1.5 hover:opacity-70 transition"
                          style={{ color: '#4a8a4a', fontFamily: font.mono }}
                        >
                          <CheckCircle size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/school/lesson/${l.id}`)}
                          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5"
                          style={{ borderColor: '#222', color: '#4a8a4a', fontFamily: font.mono }}
                        >
                          Открыть
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {allCompleted && (
                <p className="text-center text-sm mt-6" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                  Все занятия завершены ✓
                </p>
              )}
            </>
          )}

          {selectedCourseData && !selectedAccessible && (
            <div className="flex flex-col items-center justify-center py-20">
              <Lock size={32} style={{ color: '#333' }} className="mb-4" />
              <p className="text-sm" style={{ color: '#555', fontFamily: font.mono }}>Программа закрыта</p>
            </div>
          )}

          {!selectedCourse && (() => {
            const canAccess = (c: Course) => role === 'admin' || c.is_free || accessMap.has(c.id);
            const accessibleCourses = courses.filter(canAccess);

            let activeCourse: Course | null = null;
            let activeNextLesson: Lesson | null = null;

            for (const c of accessibleCourses) {
              const cLessons = getCourseLessons(c.id);
              const next = getFirstUnlockedIncompleteLesson(c, cLessons);
              if (next) {
                activeCourse = c;
                activeNextLesson = next;
                break;
              }
            }

            if (!activeCourse) {
              for (const c of accessibleCourses) {
                const cLessons = getCourseLessons(c.id);
                const unlockedLessons = getUnlockedLessons(c, cLessons);
                const completedUnlockedCount = getCompletedUnlockedCount(c, cLessons);

                // Transparent completion rule for home card:
                // compare completedUnlockedCount vs unlockedLessons.length
                if (unlockedLessons.length > 0 && completedUnlockedCount >= unlockedLessons.length) {
                  activeCourse = c;
                  break;
                }
              }
            }

            const ap = activeCourse ? (progress[activeCourse.id] || { completed: 0, total: 0 }) : null;
            const apct = ap && ap.total > 0 ? Math.round((ap.completed / ap.total) * 100) : 0;
            const activeLessons = activeCourse ? getCourseLessons(activeCourse.id) : [];
            const activeUnlockedLessons = activeCourse ? getUnlockedLessons(activeCourse, activeLessons) : [];
            const activeCompletedUnlockedCount = activeCourse ? getCompletedUnlockedCount(activeCourse, activeLessons) : 0;
            const activeAllCompleted = !!activeCourse
              && activeLessons.length > 0
              && activeUnlockedLessons.length >= activeLessons.length
              && activeCompletedUnlockedCount >= activeLessons.length;

            return (
              <div className="py-8 sm:py-12">
                <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: font.heading }}>
                  Добро пожаловать в систему
                </h1>
                <p className="text-sm mb-8" style={{ color: '#666', fontFamily: font.mono }}>
                  Кабинет трейдера
                </p>

                {activeCourse && activeCourse.title === 'TRADE MASTER 4.5' && (
                  <div className="rounded-xl border p-5 sm:p-6" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
                    <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: '#555', fontFamily: font.mono }}>
                      {ap && ap.completed > 0 ? 'Текущая программа' : 'Начните подготовку'}
                    </p>
                    <h2 className="text-xl sm:text-2xl mb-1" style={{ fontFamily: font.heading }}>
                      {activeCourse.title}
                    </h2>
                    {activeCourse.subtitle && (
                      <p className="text-xs mb-4" style={{ color: '#666', fontFamily: font.mono }}>{activeCourse.subtitle}</p>
                    )}

                    {ap && ap.total > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${apct}%`, backgroundColor: '#4a8a4a' }} />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: '#666', fontFamily: font.mono }}>
                            {ap.completed}/{ap.total} · {apct}%
                          </span>
                        </div>
                      </div>
                    )}

                    {!activeAllCompleted && (() => {
                      const target = activeNextLesson || (activeUnlockedLessons.length > 0 ? activeUnlockedLessons[0] : null);
                      if (!target) return null;
                      return (
                        <button
                          onClick={() => navigate(`/school/lesson/${target.id}`)}
                          className="w-full rounded-lg border p-3 flex items-center justify-between transition-all hover:border-[#2a2a2a]"
                          style={{ borderColor: '#1a1a1a', backgroundColor: '#111' }}
                        >
                          <div className="text-left min-w-0">
                            <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                              {ap && ap.completed === 0 ? 'Начать' : 'Продолжить'}
                            </p>
                            <p className="text-sm truncate" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>
                              Занятие {activeLessons.indexOf(target) + 1}. {target.title}
                            </p>
                          </div>
                          <ArrowRight size={16} style={{ color: '#4a8a4a' }} className="flex-shrink-0 ml-3" />
                        </button>
                      );
                    })()}

                    {activeAllCompleted && (
                      <p className="text-sm" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                        Все занятия завершены ✓
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Activate invite code section */}
          <ActivateCodeSection userId={user?.id} onActivated={() => window.location.reload()} />
        </div>
      </main>
    </div>
  );
}

function ActivateCodeSection({ userId, onActivated }: { userId?: string; onActivated: () => void }) {
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
    <div className="mt-10 rounded-xl border p-5" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={14} style={{ color: '#666' }} />
        <span className="text-xs uppercase tracking-wider" style={{ color: '#666', fontFamily: "'Inter', sans-serif" }}>
          Активировать инвайт-код
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Введите код"
          className="flex-1 px-3 py-2 rounded-lg border text-sm"
          style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: "'Inter', sans-serif" }}
          onKeyDown={e => e.key === 'Enter' && activate()}
        />
        <button
          onClick={activate}
          disabled={loading || !code.trim()}
          className="px-4 py-2 rounded-lg text-xs whitespace-nowrap"
          style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: "'Inter', sans-serif", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : 'Активировать код'}
        </button>
      </div>
      {message && (
        <p className="text-xs mt-2" style={{ color: message.success ? '#4a8a4a' : '#e85d3a', fontFamily: "'Inter', sans-serif" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
