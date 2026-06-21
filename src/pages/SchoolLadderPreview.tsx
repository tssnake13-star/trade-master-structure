import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import StructureField from '@/components/landing/StructureField';
import { useDashboardTexts } from '@/lib/dashboardTexts';
import { SelectedCourseView, type Course, type Lesson } from './SchoolDashboard';

/**
 * /school/ladder-preview — faithful BEFORE/AFTER of the course-detail view,
 * rendered in the REAL cabinet skin (data-school-skin → школьные токены, острые
 * карточки, фон «Структура»). Левая/верхняя половина — настоящий боевой
 * SelectedCourseView; нижняя — предлагаемая v3-«лестница этапов». Одни и те же
 * демо-данные. Боевой /school/dashboard не затронут.
 */

// --- prod cabinet constants (identical to SchoolDashboard) ---
const ACCENT = '#e1a84d';
const FG = '#e8e0d0';
const CARD = '#181410';
const BORDER = '#1a1a1a';
const BG = '#080808';
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Syne', system-ui, sans-serif";
const DISPLAY = "'Cormorant', Georgia, 'Times New Roman', serif";

const CabinetBg = () => (
  <StructureField
    position="fixed"
    opacity={0.5}
    zIndex={0}
    mask="radial-gradient(150% 120% at 50% 38%, #000 45%, transparent 92%)"
  />
);

// --- shared demo data (the same Course/Lesson shape the live dashboard uses) ---
const DEMO_COURSE: Course = {
  id: 'demo-tm45',
  title: 'TRADE MASTER 5.0',
  subtitle: 'Основная программа · 8 блоков системы допуска к сделке',
  is_free: false,
  sort_order: 1,
};

const DEMO_TITLES = [
  'Архитектура рынка',
  'Психология капитала',
  'Echo Gate — допуск к сделке',
  'Контекст и структура',
  'Точки разворота',
  'Фильтрация контекста',
  'Hunter Bot — автоматизация входа',
  'Risk Sentinel — защита капитала',
];
const DEMO_LESSONS: Lesson[] = DEMO_TITLES.map((title, i) => ({
  id: `demo-l${i + 1}`,
  course_id: DEMO_COURSE.id,
  title,
  description: null,
  sort_order: i + 1,
}));

// 5 пройдено, 6-й — текущий (разблокирован), 7-8 закрыты
const COMPLETED = new Set(DEMO_LESSONS.slice(0, 5).map((l) => l.id));
const UNLOCKED_SORT = [1, 2, 3, 4, 5, 6];
const PROGRESS = { completed: 5, total: 8 };
const PCT = Math.round((PROGRESS.completed / PROGRESS.total) * 100);
const NEXT_LESSON = DEMO_LESSONS[5];

const eyebrow = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, ...extra,
});

// =====================================================================
//   PROPOSED v3 — "лестница этапов"
// =====================================================================
function LadderV3() {
  return (
    <>
      {/* header — масштабный Cormorant + линия прогресса, как на лендинге */}
      <div className="mb-9">
        <div style={eyebrow({ marginBottom: 14 })}>Программа · этап 06 из 08</div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(30px, 5vw, 54px)', lineHeight: 1.04, letterSpacing: '-0.025em', color: FG }}>
          TRADE <em style={{ fontStyle: 'italic', color: ACCENT, fontWeight: 350 }}>Master</em> 5.0
        </h1>
        <p className="mt-3" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#a8a090', maxWidth: '58ch' }}>
          Вы прошли {PCT}% системы. Пять этапов закрыто, сейчас — фильтрация контекста.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1" style={{ height: 2, backgroundColor: BORDER, overflow: 'hidden' }}>
            <div style={{ width: `${PCT}%`, height: '100%', backgroundColor: ACCENT }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#666', fontVariantNumeric: 'tabular-nums' }}>
            {PROGRESS.completed}/{PROGRESS.total} · {PCT}%
          </span>
        </div>
      </div>

      {/* ladder */}
      <div style={{ position: 'relative' }}>
        {DEMO_LESSONS.map((l, i) => {
          const num = i + 1;
          const done = COMPLETED.has(l.id);
          const unlocked = UNLOCKED_SORT.includes(num);
          const current = unlocked && !done; // первый разблокированный незавершённый
          const state: 'done' | 'current' | 'locked' = done ? 'done' : current ? 'current' : 'locked';
          const last = i === DEMO_LESSONS.length - 1;
          const connectorGold = done; // золото идёт через пройденные, стоп на текущем

          const node =
            state === 'done'
              ? { border: ACCENT, bg: `${ACCENT}1a`, color: ACCENT }
              : state === 'current'
                ? { border: ACCENT, bg: ACCENT, color: '#0a0a0a' }
                : { border: '#2a2a2a', bg: 'transparent', color: '#55504a' };

          return (
            <div
              key={l.id}
              style={{ position: 'relative', paddingLeft: 72, paddingBottom: last ? 0 : 28, opacity: state === 'locked' ? 0.5 : 1 }}
            >
              {!last && (
                <span style={{ position: 'absolute', left: 23, top: 46, bottom: -2, width: 2, backgroundColor: connectorGold ? ACCENT : '#2a2620' }} />
              )}
              <span
                style={{
                  position: 'absolute', left: 2, top: 0, width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${node.border}`, backgroundColor: node.bg, color: node.color,
                  fontFamily: MONO, fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums',
                }}
              >
                {state === 'done' ? '✓' : state === 'locked' ? <Lock size={15} /> : String(num).padStart(2, '0')}
              </span>

              {state === 'current' ? (
                <div
                  style={{
                    marginTop: -4, padding: '18px 20px',
                    border: `1px solid ${ACCENT}`, backgroundColor: CARD, borderRadius: 10,
                    background: `radial-gradient(circle at 0% 0%, ${ACCENT}24 0%, ${CARD} 62%)`,
                  }}
                >
                  <div style={eyebrow({ marginBottom: 5, color: ACCENT })}>Этап {String(num).padStart(2, '0')} · сейчас</div>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 25, lineHeight: 1.15, color: FG, marginBottom: 10 }}>{l.title}</h3>
                  <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, color: '#a8a090', maxWidth: '54ch', marginBottom: 16 }}>
                    Как отбросить 80% сетапов и оставить только рабочие — где система допуска отделяет импульс от структуры.
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span style={{ fontFamily: MONO, fontSize: 11, color: '#666' }}>Видео · PDF · 24 мин</span>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
                        backgroundColor: ACCENT, color: '#0a0a0a', padding: '9px 16px', borderRadius: 6,
                      }}
                    >
                      Открыть <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4" style={{ minHeight: 44 }}>
                  <div className="min-w-0">
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: done ? '#888' : '#55504a', marginBottom: 3 }}>
                      Этап {String(num).padStart(2, '0')} · {done ? 'пройден' : 'закрыто'}
                    </div>
                    <h3 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 24, lineHeight: 1.1, color: done ? '#cfc7b8' : '#55504a', overflowWrap: 'anywhere' }}>{l.title}</h3>
                  </div>
                  {done ? (
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, flexShrink: 0 }}>Повторить</span>
                  ) : (
                    <Lock size={13} style={{ color: '#444', flexShrink: 0 }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// =====================================================================
export default function SchoolLadderPreview() {
  const { t } = useDashboardTexts();
  const [view, setView] = useState<'current' | 'v3'>('v3');

  return (
    <div data-school-skin className="min-h-screen relative z-10" style={{ backgroundColor: BG, color: FG }}>
      <CabinetBg />

      {/* preview banner + toggle */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap', padding: '9px 18px',
          background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888' }}>
          Preview · детальный вид курса · боевой скин · демо-данные
        </span>
        <div className="flex items-center gap-3">
          <div className="flex" style={{ border: `1px solid ${BORDER}` }}>
            {(['current', 'v3'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                  padding: '7px 14px',
                  backgroundColor: view === v ? ACCENT : 'transparent',
                  color: view === v ? '#0a0a0a' : '#888',
                }}
              >
                {v === 'current' ? 'Сейчас' : 'v3 · лестница'}
              </button>
            ))}
          </div>
          <Link to="/school/dashboard" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT }}>
            ← Боевой
          </Link>
        </div>
      </div>

      {/* body — same container the live dashboard uses */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10">
        {view === 'current' ? (
          <SelectedCourseView
            course={DEMO_COURSE}
            lessons={DEMO_LESSONS}
            unlockedSortOrders={UNLOCKED_SORT}
            completedIds={COMPLETED}
            progress={PROGRESS}
            pct={PCT}
            nextLesson={NEXT_LESSON}
            onOpen={() => {}}
            t={t}
          />
        ) : (
          <LadderV3 />
        )}
      </div>
    </div>
  );
}
