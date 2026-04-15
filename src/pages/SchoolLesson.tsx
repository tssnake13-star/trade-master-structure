import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import YouTubePlayer from '@/components/school/YouTubePlayer';
import FloatingWatermark from '@/components/school/FloatingWatermark';

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  sort_order: number;
}

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  video_url_alt: string | null;
  sort_order: number;
}

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };

function isYouTubeUrl(val: string): boolean {
  return /youtube\.com|youtu\.be/i.test(val);
}

function extractSrcFromIframe(html: string): string | null {
  const match = html.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function getYouTubeSource(val: string): string | null {
  const trimmed = val.trim();
  const candidate = trimmed.startsWith('<iframe') ? extractSrcFromIframe(trimmed) : trimmed;
  return candidate && isYouTubeUrl(candidate) ? candidate : null;
}

function renderPlayer(val: string, watermark?: React.ReactNode) {
  const containerStyle: React.CSSProperties = { width: '100%', aspectRatio: '16/9', backgroundColor: '#111', position: 'relative', overflow: 'hidden' };
  const youTubeSource = getYouTubeSource(val);

  if (youTubeSource) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <YouTubePlayer url={youTubeSource} />
        {watermark}
      </div>
    );
  }

  if (val.trimStart().startsWith('<iframe')) {
    const styled = val.replace(/<iframe/i, '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%"');
    return (
      <div className="rounded-xl overflow-hidden" style={containerStyle}
        dangerouslySetInnerHTML={{ __html: styled }} />
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={containerStyle}>
      <iframe src={val} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      {watermark}
    </div>
  );
}

export default function SchoolLesson() {
  const { id } = useParams<{ id: string }>();
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{ email: string; full_name: string | null }>({ email: '', full_name: null });

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId || !id) return;
    setLoading(true);
    const load = async () => {
      const [lessonRes, profileRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', id).single(),
        supabase.from('profiles').select('email, full_name').eq('user_id', userId).single(),
      ]);

      if (profileRes.data) {
        setProfileData({ email: profileRes.data.email, full_name: profileRes.data.full_name });
      }

      const l = lessonRes.data as LessonData | null;
      setLesson(l);

      if (l) {
        const [progressRes, nextRes, prevRes, videosRes] = await Promise.all([
          supabase.from('lesson_progress').select('id').eq('user_id', userId).eq('lesson_id', l.id),
          supabase.from('lessons').select('id').eq('course_id', l.course_id).gt('sort_order', l.sort_order).order('sort_order').limit(1),
          supabase.from('lessons').select('id').eq('course_id', l.course_id).lt('sort_order', l.sort_order).order('sort_order', { ascending: false }).limit(1),
          supabase.from('lesson_videos').select('*').eq('lesson_id', l.id).order('sort_order'),
        ]);
        setIsCompleted((progressRes.data || []).length > 0);
        setNextLessonId(nextRes.data?.[0]?.id || null);
        setPrevLessonId(prevRes.data?.[0]?.id || null);
        setVideos((videosRes.data || []) as VideoData[]);
      }
      setLoading(false);
    };
    load();
  }, [userId, id]);

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

  const btnBase: React.CSSProperties = {
    fontFamily: font.mono, fontSize: '13px', padding: '10px 16px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', flex: '1', justifyContent: 'center',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      <header className="border-b px-4 py-3" style={{ borderColor: '#1a1a1a' }}>
        <button
          onClick={() => navigate(`/school/course/${lesson.course_id}`)}
          className="flex items-center gap-2 hover:opacity-70 transition text-sm"
          style={{ color: '#666', fontFamily: font.mono }}
        >
          <ArrowLeft size={16} />
          Вернуться к курсу
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl mb-3" style={{ fontFamily: font.heading }}>{lesson.title}</h1>

        {lesson.description && (
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#999', fontFamily: font.mono }}>
            {lesson.description}
          </p>
        )}

        {videos.length > 0 && (
          <div className="space-y-6 mb-8">
            {videos.map(v => {
              const hasMain = !!v.video_url;
              const hasAlt = !!v.video_url_alt;
              const hasBoth = hasMain && hasAlt;
              const wm = profileData.email ? <FloatingWatermark email={profileData.email} fullName={profileData.full_name} /> : null;
              return (
                <div key={v.id}>
                  {v.title && (
                    <p className="text-sm mb-2" style={{ color: '#e8e0d0', fontFamily: font.mono }}>{v.title}</p>
                  )}
                  <div className="space-y-3">
                    {hasMain && (
                      <div>
                        {hasBoth && <p className="text-xs mb-1" style={{ color: '#666', fontFamily: font.mono }}>YouTube</p>}
                        {renderPlayer(v.video_url, wm)}
                      </div>
                    )}
                    {hasAlt && (
                      <div>
                        {hasBoth && <p className="text-xs mb-1" style={{ color: '#666', fontFamily: font.mono }}>Дзен / RuTube</p>}
                        {renderPlayer(v.video_url_alt!, wm)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => prevLessonId && navigate(`/school/lesson/${prevLessonId}`)}
            disabled={!prevLessonId}
            style={{
              ...btnBase, borderColor: prevLessonId ? '#1a1a1a' : '#111', color: prevLessonId ? '#e8e0d0' : '#333',
              border: '1px solid', cursor: prevLessonId ? 'pointer' : 'default', opacity: prevLessonId ? 1 : 0.4,
            }}
          >
            <ArrowLeft size={14} /> Предыдущий
          </button>

          {!isCompleted ? (
            <button onClick={markComplete} disabled={marking}
              style={{ ...btnBase, backgroundColor: '#4a8a4a', color: '#e8e0d0', opacity: marking ? 0.6 : 1 }}>
              <CheckCircle size={14} /> {marking ? '...' : 'Пройден'}
            </button>
          ) : (
            <span style={{ ...btnBase, backgroundColor: '#1a2e1a', color: '#4a8a4a' }}>
              <CheckCircle size={14} /> Пройдено
            </span>
          )}

          <button
            onClick={() => nextLessonId && isCompleted && navigate(`/school/lesson/${nextLessonId}`)}
            disabled={!nextLessonId || !isCompleted}
            style={{
              ...btnBase, borderColor: nextLessonId && isCompleted ? '#1a1a1a' : '#111',
              color: nextLessonId && isCompleted ? '#e8e0d0' : '#333', border: '1px solid',
              cursor: nextLessonId && isCompleted ? 'pointer' : 'default',
              opacity: !nextLessonId ? 0.4 : isCompleted ? 1 : 0.5,
            }}
          >
            Следующий <ArrowRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
}
