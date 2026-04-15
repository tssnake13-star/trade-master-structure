import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Lock, BookOpen, Settings, LogOut } from 'lucide-react';
import logo from '@/assets/logo-tradeliketyo.jpeg';
import YouTubePlayer from '@/components/school/YouTubePlayer';
import FloatingWatermark from '@/components/school/FloatingWatermark';

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
  const [welcomeVideo, setWelcomeVideo] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [coursesRes, accessRes, lessonsRes, progressRes, settingsRes] = await Promise.all([
        supabase.from('courses').select('*').order('sort_order'),
        supabase.from('course_access').select('course_id').eq('user_id', user.id),
        supabase.from('lessons').select('id, course_id'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
        supabase.from('site_settings').select('value').eq('key', 'dashboard_welcome_video').single(),
      ]);

      const courseList = (coursesRes.data || []) as Course[];
      setCourses(courseList);
      setAccessIds(new Set((accessRes.data || []).map(a => a.course_id)));
      setWelcomeVideo(settingsRes.data?.value || '');

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

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^?&]+)/);
    return match?.[1] || null;
  };

  const videoId = welcomeVideo ? extractYouTubeId(welcomeVideo) : null;

  const profileEmail = user?.email || '';
  const watermark = profileEmail ? <FloatingWatermark email={profileEmail} fullName={null} /> : null;

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
                  opacity: accessible ? 1 : 0.4,
                  cursor: accessible ? 'pointer' : 'default',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate" style={{ fontFamily: font.mono, color: accessible ? '#e8e0d0' : '#444' }}>
                    {c.title}
                  </span>
                  {!accessible && <Lock size={12} style={{ color: '#333' }} />}
                </div>
                {accessible && p.total > 0 && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }} />
                    </div>
                    <span className="text-[10px] mt-0.5 block" style={{ color: '#555', fontFamily: font.mono }}>
                      {p.completed}/{p.total}
                    </span>
                  </div>
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
            <span className="text-sm" style={{ fontFamily: font.heading }}>Школа</span>
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: font.heading }}>
              Добро пожаловать
            </h1>
            <p className="text-sm" style={{ color: '#666', fontFamily: font.mono }}>
              {user?.email}
            </p>
          </div>

          {/* Welcome video */}
          {videoId && (
            <div className="mb-8">
              <YouTubePlayer url={welcomeVideo} watermark={watermark} />
            </div>
          )}

          {/* Mobile course list */}
          <div className="sm:hidden">
            <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Курсы</h2>
            <div className="space-y-3">
              {courses.map(c => {
                const accessible = hasAccess(c);
                const p = progress[c.id] || { completed: 0, total: 0 };
                const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;

                return (
                  <div
                    key={c.id}
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
                      <h3 className="text-base" style={{ fontFamily: font.mono }}>{c.title}</h3>
                      {!accessible && <Lock size={14} style={{ color: '#444' }} />}
                      {accessible && <BookOpen size={14} style={{ color: '#4a8a4a' }} />}
                    </div>
                    {c.subtitle && (
                      <p className="text-xs mb-2" style={{ color: '#666', fontFamily: font.mono }}>{c.subtitle}</p>
                    )}
                    {accessible && p.total > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1" style={{ color: '#666', fontFamily: font.mono }}>
                          <span>{p.completed}/{p.total} уроков</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#4a8a4a' }} />
                        </div>
                      </div>
                    )}
                    {!accessible && (
                      <p className="text-xs" style={{ color: '#444', fontFamily: font.mono }}>Доступ закрыт</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
