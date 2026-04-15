import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  course_id: string;
  sort_order: number;
}

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };

export default function SchoolLesson() {
  const { id } = useParams<{ id: string }>();
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const lessonRes = await supabase.from('lessons').select('*').eq('id', id).single();
      const l = lessonRes.data as LessonData | null;
      setLesson(l);

      if (l) {
        const [progressRes, nextRes] = await Promise.all([
          supabase.from('lesson_progress').select('id').eq('user_id', user.id).eq('lesson_id', l.id),
          supabase.from('lessons').select('id').eq('course_id', l.course_id).gt('sort_order', l.sort_order).order('sort_order').limit(1),
        ]);
        setIsCompleted((progressRes.data || []).length > 0);
        setNextLessonId(nextRes.data?.[0]?.id || null);
      }
      setLoading(false);
    };
    load();
  }, [user, id]);

  const markComplete = async () => {
    if (!user || !lesson || isCompleted) return;
    setMarking(true);
    await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: lesson.id });
    setIsCompleted(true);
    setMarking(false);
  };

  if (authLoading || loading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      <header className="border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: '#1a1a1a' }}>
        <button onClick={() => navigate(`/school/course/${lesson.course_id}`)} className="hover:opacity-70 transition">
          <ArrowLeft size={18} style={{ color: '#666' }} />
        </button>
        <h1 className="text-lg truncate" style={{ fontFamily: font.heading }}>{lesson.title}</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        {lesson.video_url && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6" style={{ backgroundColor: '#111' }}>
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        <h2 className="text-2xl mb-3" style={{ fontFamily: font.heading }}>{lesson.title}</h2>

        {lesson.description && (
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#999', fontFamily: font.mono }}>
            {lesson.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {!isCompleted ? (
            <button
              onClick={markComplete}
              disabled={marking}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: '#4a8a4a',
                color: '#e8e0d0',
                fontFamily: font.mono,
                opacity: marking ? 0.6 : 1,
              }}
            >
              <CheckCircle size={16} />
              {marking ? '...' : 'Отметить как пройденный'}
            </button>
          ) : (
            <span
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: '#1a2e1a', color: '#4a8a4a', fontFamily: font.mono }}
            >
              <CheckCircle size={16} />
              Пройдено
            </span>
          )}

          {nextLessonId && (
            <button
              onClick={() => navigate(`/school/lesson/${nextLessonId}`)}
              disabled={!isCompleted}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm transition-all"
              style={{
                borderColor: isCompleted ? '#1a1a1a' : '#111',
                color: isCompleted ? '#e8e0d0' : '#333',
                fontFamily: font.mono,
                cursor: isCompleted ? 'pointer' : 'default',
              }}
            >
              Следующий урок
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
