import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Settings, LogOut, ArrowRight, CheckCircle } from 'lucide-react';
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
      const accessSet = new Set(accessData.map(a => a.course_id));
      const aMap = new Map(accessData.map(a => [a.course_id, { courseId: a.course_id, unlocked: a.unlocked_lessons || [1] }]));
      const lessons = (lessonsRes.data || []) as Lesson[];
      const completedSet = new Set((progressRes.data || []).map(p => p.lesson_id));

      setCourses(courseList);
      setAccessMap(aMap);
      setAllLessons(lessons);
      setCompletedIds(completedSet);

      const pm: ProgressMap = {};
      for (const c of courseList) {
        const total = lessons.filter(l => l.course_id === c.id).length;
        const completed = lessons.filter(l => l.course_id === c.id && completedSet.has(l.id)).length;
        pm[c.id] = { completed, total };
      }
      setProgress(pm);

      // Auto-select course from navigation state only (not by default — home screen shown)
      const canAccess = (c: Course) => role === 'admin' || c.is_free || accessSet.has(c.id);
      const stateId = (location.state as any)?.selectedCourse;
      if (stateId) {
        const fromState = courseList.find(c => c.id === stateId && canAccess(c));
        if (fromState) setSelectedCourse(fromState.id);
        // Clear state so returning to dashboard shows home screen
        window.history.replaceState({}, '');
      } else {
        setSelectedCourse(null);
      }

      setLoading(false);
    };
    load();
  }, [user, role]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  const hasAccess = (c: Course) => role === 'admin' || c.is_free || accessIds.has(c.id);

  // Lessons for selected course
  const selectedLessons = selectedCourse
    ? allLessons.filter(l => l.course_id === selectedCourse).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const selectedAccessible = selectedCourseData ? hasAccess(selectedCourseData) : false;

  // Find first incomplete lesson for "Продолжить"
  const nextLesson = selectedAccessible
    ? selectedLessons.find(l => !completedIds.has(l.id))
    : null;
  const allCompleted = selectedAccessible && selectedLessons.length > 0 && !nextLesson;

  const p = selectedCourse ? (progress[selectedCourse] || { completed: 0, total: 0 }) : { completed: 0, total: 0 };
  const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col sm:flex-row" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      {/* Sidebar */}
      <aside
        className="hidden sm:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ borderColor: '#1a1a1a', backgroundColor: '#0a0a0a' }}
      >
        <div className="border-b cursor-pointer relative overflow-hidden" style={{ borderColor: '#1a1a1a' }} onClick={() => setSelectedCourse(null)}>
          <video src={logoVideo} autoPlay loop muted playsInline className="w-full object-cover block" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {courses.map(c => {
            const accessible = hasAccess(c);
            const cp = progress[c.id] || { completed: 0, total: 0 };
            const cpct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
            const isSelected = selectedCourse === c.id;

            return (
              <button
                key={c.id}
                onClick={() => accessible && setSelectedCourse(c.id)}
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
                {accessible && cp.total > 0 && (
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

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <header className="sm:hidden border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-2">
            <video src={logoVideo} autoPlay loop muted playsInline className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-sm" style={{ fontFamily: font.heading }}>Кабинет трейдера</span>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Mobile course selector */}
        <div className="sm:hidden border-b overflow-x-auto" style={{ borderColor: '#1a1a1a' }}>
          <div className="flex p-2 gap-1">
            {courses.map(c => {
              const accessible = hasAccess(c);
              const isSelected = selectedCourse === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => accessible && setSelectedCourse(c.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all"
                  style={{
                    fontFamily: font.mono,
                    backgroundColor: isSelected ? '#141414' : 'transparent',
                    color: accessible ? (isSelected ? '#e8e0d0' : '#888') : '#444',
                    opacity: accessible ? 1 : 0.5,
                    cursor: accessible ? 'pointer' : 'default',
                  }}
                >
                  {!accessible && <Lock size={10} className="inline mr-1" style={{ color: '#444' }} />}
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 sm:p-8">
          {selectedCourseData && selectedAccessible && (
            <>
              {/* Program header with progress */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: font.heading }}>
                  {selectedCourseData.title}
                </h1>
                {selectedCourseData.subtitle && (
                  <p className="text-sm mb-3" style={{ color: '#666', fontFamily: font.mono }}>{selectedCourseData.subtitle}</p>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }} />
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#666', fontFamily: font.mono }}>
                    {p.completed}/{p.total} · {pct}%
                  </span>
                </div>
              </div>

              {/* Continue button */}
              {nextLesson && (
                <button
                  onClick={() => navigate(`/school/lesson/${nextLesson.id}`)}
                  className="w-full rounded-xl border p-4 mb-6 flex items-center justify-between transition-all hover:border-[#2a2a2a]"
                  style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}
                >
                  <div className="text-left min-w-0">
                    <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                      {p.completed === 0 ? 'Начать' : 'Продолжить'}
                    </p>
                    <p className="text-sm truncate" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>
                      Занятие {selectedLessons.indexOf(nextLesson) + 1}. {nextLesson.title}
                    </p>
                  </div>
                  <ArrowRight size={16} style={{ color: '#4a8a4a' }} className="flex-shrink-0 ml-3" />
                </button>
              )}

              {/* Lesson list */}
              <div className="space-y-1">
                {selectedLessons.map((l, i) => {
                  const done = completedIds.has(l.id);
                  return (
                    <div
                      key={l.id}
                      className="rounded-lg px-4 py-3 flex items-start gap-3 transition-all hover:bg-white/[0.03]"
                    >
                      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: done ? '#4a8a4a' : '#555', fontFamily: font.mono, minWidth: '1.5rem' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm block" style={{ fontFamily: font.mono, color: done ? '#666' : '#e8e0d0' }}>
                          {l.title}
                        </span>
                        {l.description && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#555', fontFamily: font.mono }}>
                            {l.description}
                          </p>
                        )}
                      </div>
                      {done ? (
                        <span className="flex-shrink-0 flex items-center gap-1 text-xs py-1.5" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                          <CheckCircle size={14} />
                        </span>
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
            // Find the program with most recent progress (or first accessible)
            const canAccess = (c: Course) => role === 'admin' || c.is_free || accessIds.has(c.id);
            const accessibleCourses = courses.filter(canAccess);
            
            // Find course with incomplete progress (last active)
            let activeCourse: Course | null = null;
            let activeNextLesson: Lesson | null = null;
            
            for (const c of accessibleCourses) {
              const cLessons = allLessons.filter(l => l.course_id === c.id).sort((a, b) => a.sort_order - b.sort_order);
              const next = cLessons.find(l => !completedIds.has(l.id));
              if (next) {
                activeCourse = c;
                activeNextLesson = next;
                break;
              }
            }
            
            // Fallback: first accessible course with lessons
            if (!activeCourse) {
              activeCourse = accessibleCourses.find(c => allLessons.some(l => l.course_id === c.id)) || null;
            }
            
            const ap = activeCourse ? (progress[activeCourse.id] || { completed: 0, total: 0 }) : null;
            const apct = ap && ap.total > 0 ? Math.round((ap.completed / ap.total) * 100) : 0;
            const activeLessons = activeCourse ? allLessons.filter(l => l.course_id === activeCourse!.id).sort((a, b) => a.sort_order - b.sort_order) : [];

            return (
              <div className="py-8 sm:py-12">
                <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: font.heading }}>
                  Добро пожаловать в систему
                </h1>
                <p className="text-sm mb-8" style={{ color: '#666', fontFamily: font.mono }}>
                  Кабинет трейдера
                </p>

                {activeCourse && (
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

                    {activeNextLesson && (
                      <button
                        onClick={() => navigate(`/school/lesson/${activeNextLesson!.id}`)}
                        className="w-full rounded-lg border p-3 flex items-center justify-between transition-all hover:border-[#2a2a2a]"
                        style={{ borderColor: '#1a1a1a', backgroundColor: '#111' }}
                      >
                        <div className="text-left min-w-0">
                          <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                            {ap && ap.completed === 0 ? 'Начать' : 'Продолжить'}
                          </p>
                          <p className="text-sm truncate" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>
                            Занятие {activeLessons.indexOf(activeNextLesson!) + 1}. {activeNextLesson!.title}
                          </p>
                        </div>
                        <ArrowRight size={16} style={{ color: '#4a8a4a' }} className="flex-shrink-0 ml-3" />
                      </button>
                    )}

                    {!activeNextLesson && ap && ap.completed > 0 && (
                      <p className="text-sm" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                        Все занятия завершены ✓
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
