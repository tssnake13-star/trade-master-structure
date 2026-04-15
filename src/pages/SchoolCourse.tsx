import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Lock } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

const font = { heading: "'Inter', sans-serif", mono: "'Inter', sans-serif" };

export default function SchoolCourse() {
  const { id } = useParams<{ id: string }>();
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [courseRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('title').eq('id', id).single(),
        supabase.from('lessons').select('id, title, description, sort_order').eq('course_id', id).order('sort_order'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
      ]);
      setCourseTitle(courseRes.data?.title || '');
      setLessons(lessonsRes.data || []);
      setCompletedIds(new Set((progressRes.data || []).map(p => p.lesson_id)));
      setLoading(false);
    };
    load();
  }, [user, id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    return completedIds.has(lessons[index - 1]?.id);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      <header className="border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: '#1a1a1a' }}>
        <button onClick={() => navigate('/school/dashboard')} className="hover:opacity-70 transition">
          <ArrowLeft size={18} style={{ color: '#666' }} />
        </button>
        <h1 className="text-xl" style={{ fontFamily: font.heading }}>{courseTitle}</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const unlocked = isUnlocked(i);
            const completed = completedIds.has(lesson.id);
            const desc = lesson.description
              ? lesson.description.length > 100
                ? lesson.description.slice(0, 100) + '…'
                : lesson.description
              : null;

            return (
              <div
                key={lesson.id}
                className="rounded-lg border p-4 transition-all"
                style={{
                  borderColor: unlocked ? '#1a1a1a' : '#141414',
                  backgroundColor: unlocked ? '#0d0d0d' : '#0a0a0a',
                  opacity: unlocked ? 1 : 0.4,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: completed ? '#4a8a4a' : '#444', fontFamily: font.mono }}
                      >
                        {completed ? '✓' : `${i + 1}.`}
                      </span>
                      <span
                        className="text-sm"
                        style={{ fontFamily: font.mono, color: unlocked ? '#e8e0d0' : '#444' }}
                      >
                        {lesson.title}
                      </span>
                    </div>
                    {desc && (
                      <p className="text-xs mt-1 ml-5" style={{ color: '#666', fontFamily: font.mono, lineHeight: '1.5' }}>
                        {desc}
                      </p>
                    )}
                  </div>
                  {unlocked ? (
                    <button
                      onClick={() => navigate(`/school/lesson/${lesson.id}`)}
                      className="text-xs px-3 py-1.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor: completed ? '#1a2e1a' : '#4a8a4a',
                        color: completed ? '#4a8a4a' : '#e8e0d0',
                        fontFamily: font.mono,
                      }}
                    >
                      Начать
                    </button>
                  ) : (
                    <Lock size={14} className="flex-shrink-0 mt-1" style={{ color: '#333' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
