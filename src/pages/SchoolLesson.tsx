import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, MessageCircle, CheckCircle, Download } from 'lucide-react';
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

const ACCENT = '#caa472';
const BG = '#080808';
const FG = '#e8e0d0';
const BORDER = '#1a1a1a';
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Inter', sans-serif";
const DISPLAY = "'Fraunces', Georgia, serif";

function isYouTubeUrl(val: string): boolean { return /youtube\.com|youtu\.be/i.test(val); }
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
  const containerStyle: React.CSSProperties = { width: '100%', aspectRatio: '16/9', backgroundColor: '#000', position: 'relative', overflow: 'hidden' };
  const youTubeSource = getYouTubeSource(val);
  if (youTubeSource) return <YouTubePlayer url={youTubeSource} watermark={watermark} />;
  if (val.trimStart().startsWith('<iframe')) {
    const styled = val.replace(/<iframe/i, '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%"');
    const clean = DOMPurify.sanitize(styled, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'src', 'style', 'frameborder'] });
    return <div style={containerStyle} dangerouslySetInnerHTML={{ __html: clean }} />;
  }
  return (
    <div style={containerStyle}>
      <iframe src={val} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      {watermark}
    </div>
  );
}

export default function SchoolLesson() {
  const { id } = useParams<{ id: string }>();
  const { session, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isFreeCourse, setIsFreeCourse] = useState(false);
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isNextUnlocked, setIsNextUnlocked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalLessons, setTotalLessons] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
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

      if (profileRes.data) setProfileData({ email: profileRes.data.email, full_name: profileRes.data.full_name });

      const l = lessonRes.data as LessonData | null;
      setLesson(l);

      if (l) {
        const [progressRes, allLessonsRes, allProgressRes, videosRes, accessRes, courseRes] = await Promise.all([
          supabase.from('lesson_progress').select('id').eq('user_id', userId).eq('lesson_id', l.id),
          supabase.from('lessons').select('id, sort_order').eq('course_id', l.course_id).order('sort_order'),
          supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
          supabase.from('lesson_videos').select('*').eq('lesson_id', l.id).order('sort_order'),
          supabase.from('course_access').select('unlocked_lessons').eq('user_id', userId).eq('course_id', l.course_id).single(),
          supabase.from('courses').select('title, is_free').eq('id', l.course_id).single(),
        ]);

        const allSorted = allLessonsRes.data || [];
        const currentIdx = allSorted.findIndex(x => x.id === l.id);
        const prev = currentIdx > 0 ? allSorted[currentIdx - 1] : null;
        const next = currentIdx < allSorted.length - 1 ? allSorted[currentIdx + 1] : null;
        const isFree = courseRes.data?.is_free || false;
        const unlocked = accessRes.data?.unlocked_lessons || [1];
        const isAdmin = role === 'admin';

        setCourseTitle(courseRes.data?.title || '');
        setIsFreeCourse(isFree);
        setTotalLessons(allSorted.length);
        setCurrentIndex(currentIdx);
        setIsCompleted((progressRes.data || []).length > 0);
        setPrevLessonId(prev?.id || null);
        setNextLessonId(next?.id || null);
        setIsNextUnlocked(next ? (isAdmin || unlocked.includes(currentIdx + 2) || isFree) : false);
        setVideos((videosRes.data || []) as VideoData[]);

        const courseLessonIds = new Set(allSorted.map(x => x.id));
        const completedInCourse = (allProgressRes.data || []).filter(p => courseLessonIds.has(p.lesson_id)).length;
        setCompletedCount(completedInCourse);
      }
      setLoading(false);
    };
    load();
  }, [userId, id, role]);

  const markCompleteSilent = async () => {
    if (!user || !lesson || isCompleted) return;
    await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: lesson.id });
    setIsCompleted(true);
  };

  const handleNext = async () => {
    if (!nextLessonId) return;
    await markCompleteSilent();
    if (isNextUnlocked) navigate(`/school/lesson/${nextLessonId}`);
  };

  if (authLoading || loading || !lesson) {
    return (
      <div data-school-skin className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: FG }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666' }}>Загрузка</p>
      </div>
    );
  }

  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Use only the primary video URL per spec ("оставить только один плеер — основной video_url")
  const watermark = profileData.email ? <FloatingWatermark email={profileData.email} fullName={profileData.full_name} /> : null;
  const primaryVideo = videos.find(v => v.video_url) || null;

  return (
    <div data-school-skin className="min-h-screen flex flex-col" style={{ backgroundColor: BG, color: FG }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: BORDER, backgroundColor: 'rgba(8,8,8,0.85)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/school/dashboard', { state: { selectedCourse: lesson.course_id } })}
            className="flex items-center gap-2 hover:opacity-70 transition min-w-0"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888' }}
          >
            <ArrowLeft size={14} className="flex-shrink-0" />
            <span className="truncate">{courseTitle}</span>
          </button>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isCompleted && (
              <span className="hidden sm:inline-flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT }}>
                <CheckCircle size={12} /> Завершено
              </span>
            )}
            {!isCompleted && (
              <span className="hidden sm:inline" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#666' }}>
                В процессе
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14">
        {/* Lesson header */}
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18 }}>
          ◆ Занятие {String(currentIndex + 1).padStart(2, '0')} из {String(totalLessons).padStart(2, '0')}
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(32px, 4.5vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: FG }}>
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="mt-4" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#a8a090', maxWidth: '60ch' }}>
            {lesson.description}
          </p>
        )}

        {/* Course progress bar */}
        <div className="mt-6 mb-10 flex items-center gap-3">
          <div className="flex-1" style={{ height: 2, backgroundColor: BORDER, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: ACCENT, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#666', fontVariantNumeric: 'tabular-nums' }}>
            {completedCount}/{totalLessons} · {pct}%
          </span>
        </div>

        {/* Video player */}
        {primaryVideo && (
          <div className="mb-10" style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
            {renderPlayer(primaryVideo.video_url, watermark)}
          </div>
        )}

        {/* Lesson 3 (free course): self-recognition checklist */}
        {lesson.id === '5ff94d3a-0174-46be-b1ee-e8ff73b13b07' && (
          <section
            className="mb-6 p-5 sm:p-6"
            style={{ border: `1px solid ${BORDER}`, borderRadius: 8, backgroundColor: '#0d0d0d' }}
          >
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(22px, 2.6vw, 28px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: FG, marginBottom: 18 }}>
              Узнали себя хотя бы в трёх пунктах?
            </h2>
            <ul className="space-y-2" style={{ fontFamily: MONO }}>
              {[
                'Закрываете сделки раньше времени',
                'Сомневаетесь после входа',
                'Прошли курсы, стабильности нет',
                'Знаете рынок, но не зарабатываете',
                'Боитесь нажать кнопку',
              ].map((item) => (
                <li key={item} className="text-sm sm:text-[15px] flex gap-2 leading-relaxed" style={{ color: FG }}>
                  <span style={{ color: '#666' }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Lesson 3: download checklist PDF */}
        {lesson.id === '5ff94d3a-0174-46be-b1ee-e8ff73b13b07' && (
          <a
            href="/files/checklist-top10.pdf"
            download="Professional Trading Blueprint.pdf"
            className="flex items-center justify-center gap-3 w-full py-4 mb-6 transition hover:brightness-110"
            style={{
              border: `1px solid ${ACCENT}`, borderRadius: 8, backgroundColor: 'transparent', color: ACCENT,
              fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
            }}
          >
            <Download size={16} />
            Скачать чек-лист: ТОП-10 ошибок трейдеров
          </a>
        )}

        {/* Free course: contact author */}
        {isFreeCourse && (
          <>
            {lesson.id === '5ff94d3a-0174-46be-b1ee-e8ff73b13b07' && (
              <p className="text-center text-sm mb-3" style={{ color: '#999', fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em' }}>
                Допуск получают <span style={{ color: ACCENT }}>не все</span>. Если узнали себя — напишите.
              </p>
            )}
            <a
              href="http://t.me/tradeliketyo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 mb-6 transition hover:brightness-110"
              style={{
                backgroundColor: ACCENT, color: '#0a0a0a', borderRadius: 8,
                fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
              }}
            >
              <MessageCircle size={16} />
              Написать автору в Telegram
            </a>
          </>
        )}

        {/* Bottom action bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-12">
          <button
            onClick={() => prevLessonId && navigate(`/school/lesson/${prevLessonId}`)}
            disabled={!prevLessonId}
            className="flex items-center justify-center gap-2 py-3.5 transition"
            style={{
              border: `1px solid ${BORDER}`, borderRadius: 8, backgroundColor: 'transparent',
              color: prevLessonId ? FG : '#444',
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
              opacity: prevLessonId ? 1 : 0.4, cursor: prevLessonId ? 'pointer' : 'default',
            }}
          >
            <ArrowLeft size={14} /> Предыдущее
          </button>

          <a
            href="https://t.me/rav_999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 transition hover:brightness-110"
            style={{
              backgroundColor: ACCENT, color: '#0a0a0a', borderRadius: 8,
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
            }}
          >
            <MessageCircle size={14} /> Выполнить задание
          </a>

          <button
            onClick={handleNext}
            disabled={!nextLessonId || !isNextUnlocked}
            className="flex items-center justify-center gap-2 py-3.5 transition"
            style={{
              border: `1px solid ${BORDER}`, borderRadius: 8, backgroundColor: 'transparent',
              color: nextLessonId && isNextUnlocked ? FG : '#444',
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
              opacity: !nextLessonId ? 0.4 : isNextUnlocked ? 1 : 0.5,
              cursor: nextLessonId && isNextUnlocked ? 'pointer' : 'default',
            }}
          >
            Следующее <ArrowRight size={14} />
          </button>
        </div>
      </main>
    </div>
  );
}
