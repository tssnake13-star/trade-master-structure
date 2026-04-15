import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, BookOpen, Settings, LogOut, ArrowRight, Play } from 'lucide-react';
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

interface ContinueData {
  lessonId: string;
  lessonTitle: string;
  lessonNumber: number;
  courseTitle: string;
  courseId: string;
  isFirstEver: boolean;
}

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };

export default function SchoolDashboard() {
  const { session, user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [accessIds, setAccessIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressMap>({});
  const [continueData, setContinueData] = useState<ContinueData | null>(null);
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
      const allLessons = (lessonsRes.data || []) as Lesson[];
      const completedSet = new Set((progressRes.data || []).map(p => p.lesson_id));

      setCourses(courseList);
      setAccessIds(accessSet);

      // Build progress map
      const pm: ProgressMap = {};
      for (const c of courseList) {
        const total = allLessons.filter(l => l.course_id === c.id).length;
        const completed = allLessons.filter(l => l.course_id === c.id && completedSet.has(l.id)).length;
        pm[c.id] = { completed, total };
      }
      setProgress(pm);

      // Find continue lesson
      const canAccess = (c: Course) => role === 'admin' || c.is_free || accessSet.has(c.id);
      const accessibleCourses = courseList.filter(canAccess);

      let found: ContinueData | null = null;

      for (const course of accessibleCourses) {
        const courseLessons = allLessons
          .filter(l => l.course_id === course.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        for (let i = 0; i < courseLessons.length; i++) {
          if (!completedSet.has(courseLessons[i].id)) {
            found = {
              lessonId: courseLessons[i].id,
              lessonTitle: courseLessons[i].title,
              lessonNumber: i + 1,
              courseTitle: course.title,
              courseId: course.id,
              isFirstEver: completedSet.size === 0,
            };
            break;
          }
        }
        if (found) break;
      }

      setContinueData(found);
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

  const CourseCard = ({ c, accessible }: { c: Course; accessible: boolean }) => {
    const p = progress[c.id] || { completed: 0, total: 0 };
    const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

    return (
      <div
        onClick={() => accessible && navigate(`/school/course/${c.id}`)}
        className="rounded-xl border p-4 transition-all"
        style={{
          borderColor: accessible ? '#1a1a1a' : '#141414',
          backgroundColor: accessible ? '#0d0d0d' : '#0a0a0a',
          opacity: accessible ? 1 : 0.5,
          cursor: accessible ? 'pointer' : 'default',
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm sm:text-base" style={{ fontFamily: font.mono, color: accessible ? '#e8e0d0' : '#444' }}>{c.title}</h3>
          {!accessible && <Lock size={14} style={{ color: '#444' }} />}
          {accessible && <BookOpen size={14} style={{ color: '#4a8a4a' }} />}
        </div>
        {c.subtitle && (
          <p className="text-xs mb-2" style={{ color: '#666', fontFamily: font.mono }}>{c.subtitle}</p>
        )}
        {accessible && p.total > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: '#666', fontFamily: font.mono }}>
              <span>{p.completed}/{p.total} занятий</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }} />
            </div>
          </div>
        )}
        {!accessible && (
          <p className="text-xs mt-1" style={{ color: '#444', fontFamily: font.mono }}>Закрыто</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      {/* Sidebar */}
      <aside
        className="hidden sm:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ borderColor: '#1a1a1a', backgroundColor: '#0a0a0a' }}
      >
        <div className="border-b" style={{ borderColor: '#1a1a1a' }}>
          <img src={logo} alt="TRADELIKETYO" className="w-full object-cover" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {courses.map(c => {
            const accessible = hasAccess(c);
            const p = progress[c.id] || { completed: 0, total: 0 };
            const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            const isSelected = selectedCourse === c.id;

            return (
              <button
                key={c.id}
                onClick={() => {
                  if (accessible) {
                    setSelectedCourse(c.id);
                    navigate(`/school/course/${c.id}`);
                  }
                }}
                className="w-full text-left rounded-lg px-3 py-2.5 transition-all"
                style={{
                  backgroundColor: isSelected ? '#141414' : 'transparent',
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
                {accessible && p.total > 0 && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }} />
                    </div>
                    <span className="text-[10px] mt-0.5 block" style={{ color: '#555', fontFamily: font.mono }}>
                      {p.completed}/{p.total} занятий
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

        <div className="max-w-3xl mx-auto p-4 sm:p-8">
          {/* Welcome block */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: font.heading }}>
              Добро пожаловать в систему
            </h1>
            <p className="text-sm" style={{ color: '#666', fontFamily: font.mono }}>
              {user?.email}
            </p>
          </div>

          {/* Continue card */}
          {continueData && (
            <div
              className="rounded-xl border p-5 mb-6 cursor-pointer transition-all hover:border-[#2a2a2a]"
              style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}
              onClick={() => navigate(`/school/lesson/${continueData.lessonId}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
                    {continueData.isFirstEver ? 'Начать подготовку' : 'Продолжить'}
                  </p>
                  <p className="text-sm mb-1" style={{ color: '#666', fontFamily: font.mono }}>
                    {continueData.courseTitle}
                  </p>
                  <p className="text-base truncate" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>
                    Занятие {continueData.lessonNumber}. {continueData.lessonTitle}
                  </p>
                </div>
                <button
                  className="flex-shrink-0 ml-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs transition-all"
                  style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}
                >
                  {continueData.isFirstEver ? <Play size={14} /> : <ArrowRight size={14} />}
                  {continueData.isFirstEver ? 'Начать' : 'Продолжить'}
                </button>
              </div>
            </div>
          )}

          {/* Programs list */}
          <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Программы</h2>
          <div className="space-y-3">
            {courses.map(c => (
              <CourseCard key={c.id} c={c} accessible={hasAccess(c)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
