import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Settings, LogOut, ArrowRight, CheckCircle, Circle } from 'lucide-react';
import logo from '@/assets/logo-tradeliketyo.jpeg';

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
  sort_order: number;
}

interface ProgressMap {
  [courseId: string]: { completed: number; total: number };
}

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };

export default function SchoolDashboard() {
  const { session, user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [accessIds, setAccessIds] = useState<Set<string>>(new Set());
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
        supabase.from('course_access').select('course_id').eq('user_id', user.id),
        supabase.from('lessons').select('id, course_id, title, sort_order').order('sort_order'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
      ]);

      const courseList = (coursesRes.data || []) as Course[];
      const accessSet = new Set((accessRes.data || []).map(a => a.course_id));
      const lessons = (lessonsRes.data || []) as Lesson[];
      const completedSet = new Set((progressRes.data || []).map(p => p.lesson_id));

      setCourses(courseList);
      setAccessIds(accessSet);
      setAllLessons(lessons);
      setCompletedIds(completedSet);

      const pm: ProgressMap = {};
      for (const c of courseList) {
        const total = lessons.filter(l => l.course_id === c.id).length;
        const completed = lessons.filter(l => l.course_id === c.id && completedSet.has(l.id)).length;
        pm[c.id] = { completed, total };
      }
      setProgress(pm);

      // Auto-select course from navigation state or first accessible
      const canAccess = (c: Course) => role === 'admin' || c.is_free || accessSet.has(c.id);
      const stateId = (location.state as any)?.selectedCourse;
      const fromState = stateId ? courseList.find(c => c.id === stateId && canAccess(c)) : null;
      const first = fromState || courseList.find(canAccess);
      if (first) setSelectedCourse(first.id);

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
        <div className="border-b cursor-pointer" style={{ borderColor: '#1a1a1a' }} onClick={() => navigate('/school/dashboard')}>
          <img src={logo} alt="TRADELIKETYO" className="w-full object-cover" />
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
            <img src={logo} alt="TRADELIKETYO" className="w-8 h-8 rounded-lg object-cover" />
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
                    <button
                      key={l.id}
                      onClick={() => navigate(`/school/lesson/${l.id}`)}
                      className="w-full text-left rounded-lg px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/[0.03]"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {done ? (
                        <CheckCircle size={16} style={{ color: '#4a8a4a' }} className="flex-shrink-0" />
                      ) : (
                        <Circle size={16} style={{ color: '#333' }} className="flex-shrink-0" />
                      )}
                      <span className="text-xs flex-shrink-0" style={{ color: '#555', fontFamily: font.mono, minWidth: '1.5rem' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm truncate" style={{ fontFamily: font.mono, color: done ? '#666' : '#e8e0d0' }}>
                        {l.title}
                      </span>
                    </button>
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

          {!selectedCourse && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm" style={{ color: '#555', fontFamily: font.mono }}>Выберите программу</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
