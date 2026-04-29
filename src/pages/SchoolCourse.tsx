import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

const ACCENT = '#caa472';
const BG = '#080808';
const FG = '#e8e0d0';
const CARD = '#0c0c0c';
const BORDER = '#1a1a1a';
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Inter', sans-serif";
const DISPLAY = "'Fraunces', Georgia, serif";

export default function SchoolCourse() {
  const { id } = useParams<{ id: string }>();
  const { session, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubtitle, setCourseSubtitle] = useState<string | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [unlockedSortOrders, setUnlockedSortOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [courseRes, lessonsRes, progressRes, accessRes] = await Promise.all([
        supabase.from('courses').select('title, subtitle, is_free').eq('id', id).single(),
        supabase.from('lessons').select('id, title, description, sort_order').eq('course_id', id).order('sort_order'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
        supabase.from('course_access').select('unlocked_lessons').eq('user_id', user.id).eq('course_id', id).single(),
      ]);
      setCourseTitle(courseRes.data?.title || '');
      setCourseSubtitle(courseRes.data?.subtitle || null);
      setIsFree(courseRes.data?.is_free || false);
      setLessons(lessonsRes.data || []);
      setCompletedIds(new Set((progressRes.data || []).map(p => p.lesson_id)));
      setUnlockedSortOrders(accessRes.data?.unlocked_lessons || [1]);
      setLoading(false);
    };
    load();
  }, [user, id]);

  if (authLoading || loading) {
    return (
      <div data-school-skin className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: FG }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666' }}>Загрузка</p>
      </div>
    );
  }

  const isUnlocked = (index: number) => {
    const lesson = lessons[index];
    if (!lesson) return false;
    if (completedIds.has(lesson.id)) return true;
    if (role === 'admin') return true;
    if (isFree) return index === 0 || (lessons[index - 1] && completedIds.has(lessons[index - 1].id));
    return unlockedSortOrders.includes(index + 1);
  };

  const completed = lessons.filter(l => completedIds.has(l.id)).length;
  const total = lessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = Math.max(0, total - completed);

  // Find first unlocked incomplete lesson for "Continue"
  const nextLesson = lessons.find((l, i) => isUnlocked(i) && !completedIds.has(l.id)) || null;

  return (
    <div data-school-skin className="min-h-screen" style={{ backgroundColor: BG, color: FG }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: BORDER, backgroundColor: 'rgba(8,8,8,0.85)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/school/dashboard')}
            className="flex items-center gap-2 hover:opacity-70 transition"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#888' }}
          >
            <ArrowLeft size={14} />
            Главная / <span style={{ color: ACCENT }}>{courseTitle}</span>
          </button>
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#666', fontVariantNumeric: 'tabular-nums' }} className="hidden sm:inline">
            {completed}/{total} занятий · {pct}%
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Header grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18 }}>
              ◆ Программа
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: FG }}>
              {courseTitle}
            </h1>
            {courseSubtitle && (
              <p className="mt-4" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#a8a090', maxWidth: '60ch' }}>
                {courseSubtitle}
              </p>
            )}
          </div>

          <div className="p-6" style={{ border: `1px solid ${BORDER}`, backgroundColor: CARD, borderRadius: 10 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 48, lineHeight: 1, color: ACCENT, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {pct}<span style={{ fontSize: 24, color: '#888' }}>%</span>
            </div>
            <div style={{ height: 2, backgroundColor: BORDER, marginTop: 16, marginBottom: 18, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: ACCENT, transition: 'width 0.4s' }} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>
                  Завершено
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 350, color: FG, fontVariantNumeric: 'tabular-nums' }}>
                  {completed}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>
                  Осталось
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 350, color: FG, fontVariantNumeric: 'tabular-nums' }}>
                  {remaining}
                </div>
              </div>
            </div>
            {nextLesson && (
              <button
                onClick={() => navigate(`/school/lesson/${nextLesson.id}`)}
                className="w-full flex items-center justify-center gap-2 py-3 transition-all hover:brightness-110"
                style={{ backgroundColor: ACCENT, color: '#0a0a0a', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, borderRadius: 6 }}
              >
                Продолжить <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lessons list */}
        <div className="space-y-1">
          {lessons.map((l, i) => {
            const done = completedIds.has(l.id);
            const unlocked = isUnlocked(i);
            const status: 'locked' | 'done' | 'open' = !unlocked ? 'locked' : done ? 'done' : 'open';
            return (
              <div
                key={l.id}
                className="flex items-center gap-4 px-4 py-4 transition-all"
                style={{
                  borderTop: i === 0 ? `1px solid ${BORDER}` : 'none',
                  borderBottom: `1px solid ${BORDER}`,
                  opacity: status === 'locked' ? 0.45 : 1,
                }}
              >
                {/* Status box */}
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36, height: 36,
                    border: `1px solid ${status === 'done' ? ACCENT : BORDER}`,
                    backgroundColor: status === 'done' ? `${ACCENT}11` : 'transparent',
                    color: status === 'done' ? ACCENT : (status === 'open' ? FG : '#444'),
                    fontFamily: MONO, fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
                  }}
                >
                  {status === 'done' ? '✓' : status === 'locked' ? <Lock size={12} /> : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>
                    Занятие {i + 1}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: status === 'locked' ? '#555' : FG }} className="truncate">
                    {l.title}
                  </div>
                  {l.description && (
                    <div style={{ fontFamily: SANS, fontSize: 12, color: '#888', marginTop: 4, lineHeight: 1.5 }} className="truncate">
                      {l.description}
                    </div>
                  )}
                </div>

                {status === 'locked' ? (
                  <span
                    style={{
                      fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: '#666', padding: '6px 12px', backgroundColor: '#141414', borderRadius: 4,
                    }}
                  >
                    Закрыто
                  </span>
                ) : status === 'done' ? (
                  <button
                    onClick={() => navigate(`/school/lesson/${l.id}`)}
                    className="hover:opacity-70 transition flex-shrink-0"
                    style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT }}
                  >
                    Повторить →
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/school/lesson/${l.id}`)}
                    className="flex-shrink-0 hover:brightness-110 transition"
                    style={{
                      backgroundColor: ACCENT, color: '#0a0a0a',
                      fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500,
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
      </main>
    </div>
  );
}
