import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check, Lock } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  sort_order: number;
}

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };

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
        supabase.from('lessons').select('id, title, sort_order').eq('course_id', id).order('sort_order'),
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
        <div className="space-y-2">
          {lessons.map((lesson, i) => {
            const unlocked = isUnlocked(i);
            const completed = completedIds.has(lesson.id);

            return (
              <div
                key={lesson.id}
                onClick={() => unlocked && navigate(`/school/lesson/${lesson.id}`)}
                className="flex items-center gap-3 rounded-lg border p-4 transition-all"
                style={{
                  borderColor: unlocked ? '#1a1a1a' : '#141414',
                  backgroundColor: unlocked ? '#0d0d0d' : '#0a0a0a',
                  opacity: unlocked ? 1 : 0.4,
                  cursor: unlocked ? 'pointer' : 'default',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                  style={{
                    backgroundColor: completed ? '#4a8a4a' : '#1a1a1a',
                    color: completed ? '#e8e0d0' : '#444',
                    fontFamily: font.mono,
                  }}
                >
                  {completed ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-sm flex-1" style={{ fontFamily: font.mono, color: unlocked ? '#e8e0d0' : '#444' }}>
                  {lesson.title}
                </span>
                {!unlocked && <Lock size={14} style={{ color: '#333' }} />}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
