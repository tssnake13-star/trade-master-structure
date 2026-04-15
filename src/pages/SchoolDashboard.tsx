import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, BookOpen, Settings } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  is_free: boolean;
  sort_order: number;
}

interface ProgressMap {
  [courseId: string]: { completed: number; total: number };
}

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };

export default function SchoolDashboard() {
  const { session, user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [accessIds, setAccessIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [coursesRes, accessRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('*').order('sort_order'),
        supabase.from('course_access').select('course_id').eq('user_id', user.id),
        supabase.from('lessons').select('id, course_id'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
      ]);

      const courseList = (coursesRes.data || []) as Course[];
      setCourses(courseList);
      setAccessIds(new Set((accessRes.data || []).map(a => a.course_id)));

      const lessons = lessonsRes.data || [];
      const completedSet = new Set((progressRes.data || []).map(p => p.lesson_id));
      const pm: ProgressMap = {};
      for (const c of courseList) {
        const total = lessons.filter(l => l.course_id === c.id).length;
        const completed = lessons.filter(l => l.course_id === c.id && completedSet.has(l.id)).length;
        pm[c.id] = { completed, total };
      }
      setProgress(pm);
      setLoading(false);
    };
    load();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  const hasAccess = (c: Course) => role === 'admin' || c.is_free || accessIds.has(c.id);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
        <h1 className="text-xl" style={{ fontFamily: font.heading }}>Школа</h1>
        <div className="flex items-center gap-3">
          {role === 'admin' && (
            <button
              onClick={() => navigate('/school/admin')}
              className="p-2 rounded-lg hover:bg-white/5 transition"
              title="Админ-панель"
            >
              <Settings size={18} style={{ color: '#4a8a4a' }} />
            </button>
          )}
          <button
            onClick={signOut}
            className="text-xs px-3 py-1.5 rounded border transition hover:bg-white/5"
            style={{ borderColor: '#222', color: '#666', fontFamily: font.mono }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Course grid */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: font.heading }}>Курсы</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map(c => {
            const accessible = hasAccess(c);
            const p = progress[c.id] || { completed: 0, total: 0 };
            const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

            return (
              <div
                key={c.id}
                onClick={() => accessible && navigate(`/school/course/${c.id}`)}
                className="rounded-xl border p-5 transition-all"
                style={{
                  borderColor: accessible ? '#1a1a1a' : '#141414',
                  backgroundColor: accessible ? '#0d0d0d' : '#0a0a0a',
                  opacity: accessible ? 1 : 0.5,
                  cursor: accessible ? 'pointer' : 'default',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg" style={{ fontFamily: font.heading }}>
                    {c.title}
                  </h3>
                  {!accessible && <Lock size={16} style={{ color: '#444' }} />}
                  {accessible && <BookOpen size={16} style={{ color: '#4a8a4a' }} />}
                </div>
                {c.subtitle && (
                  <p className="text-xs mb-3" style={{ color: '#666', fontFamily: font.mono }}>
                    {c.subtitle}
                  </p>
                )}
                {accessible && p.total > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#666', fontFamily: font.mono }}>
                      <span>{p.completed}/{p.total} уроков</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }}
                      />
                    </div>
                  </div>
                )}
                {!accessible && (
                  <p className="text-xs" style={{ color: '#444', fontFamily: font.mono }}>
                    Доступ закрыт
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 border-t flex sm:hidden"
        style={{ backgroundColor: '#080808', borderColor: '#1a1a1a' }}
      >
        <button
          className="flex-1 py-3 flex flex-col items-center gap-1"
          style={{ color: '#4a8a4a', fontFamily: font.mono, fontSize: '10px' }}
        >
          <BookOpen size={18} />
          Курсы
        </button>
        <button
          onClick={signOut}
          className="flex-1 py-3 flex flex-col items-center gap-1"
          style={{ color: '#666', fontFamily: font.mono, fontSize: '10px' }}
        >
          <Settings size={18} />
          Профиль
        </button>
      </nav>
    </div>
  );
}
