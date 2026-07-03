import { useState } from 'react';
import { Link } from 'react-router-dom';
import StructureField from '@/components/landing/StructureField';
import { useDashboardTexts } from '@/lib/dashboardTexts';
import { SelectedCourseView, type Course, type Lesson } from './SchoolDashboard';

/**
 * /school/ladder-preview — реальный боевой SelectedCourseView (лестница этапов)
 * на демо-данных в боевом скине. Переключатель показывает два состояния:
 * «В процессе» (5/8) и «Завершён» (8/8 → финальный узел-мост к экосистеме).
 * Боевой /school/dashboard не затронут.
 */

const ACCENT = '#e1a84d';
const FG = '#e8e0d0';
const BG = '#080808';
const BORDER = '#1a1a1a';
const MONO = "'Space Mono', ui-monospace, monospace";

const CabinetBg = () => (
  <StructureField
    position="fixed"
    opacity={0.5}
    zIndex={0}
    mask="radial-gradient(150% 120% at 50% 38%, #000 45%, transparent 92%)"
  />
);

const DEMO_COURSE: Course = {
  id: 'demo-tm50',
  title: 'TRADE MASTER 5.0',
  subtitle: 'Основная программа · 8 блоков системы допуска',
  is_free: false,
  sort_order: 1,
};

const TITLES = [
  'Архитектура рынка',
  'Психология капитала',
  'Echo Gate — допуск к сделке',
  'Контекст и структура',
  'Точки разворота',
  'Фильтрация контекста',
  'Hunter Bot — автоматизация входа',
  'Risk Sentinel — защита капитала',
];
const DEMO_LESSONS: Lesson[] = TITLES.map((title, i) => ({
  id: `demo-l${i + 1}`,
  course_id: DEMO_COURSE.id,
  title,
  description: null,
  sort_order: i + 1,
}));

export default function SchoolLadderPreview() {
  const { t } = useDashboardTexts();
  const [state, setState] = useState<'progress' | 'done'>('progress');

  const doneCount = state === 'done' ? 8 : 5;
  const completed = new Set(DEMO_LESSONS.slice(0, doneCount).map((l) => l.id));
  const unlocked = state === 'done' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6];
  const progress = { completed: doneCount, total: 8 };
  const pct = Math.round((doneCount / 8) * 100);
  const next = DEMO_LESSONS.find((l) => !completed.has(l.id)) || null;

  return (
    <div data-school-skin className="min-h-screen relative z-10" style={{ backgroundColor: BG, color: FG }}>
      <CabinetBg />

      <div
        style={{
          position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap', padding: '9px 18px',
          background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888' }}>
          Preview · страница курса · боевой скин · демо-данные
        </span>
        <div className="flex items-center gap-3">
          <div className="flex" style={{ border: `1px solid ${BORDER}` }}>
            {(['progress', 'done'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setState(v)}
                style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '7px 14px',
                  backgroundColor: state === v ? ACCENT : 'transparent',
                  color: state === v ? '#0a0a0a' : '#888',
                }}
              >
                {v === 'progress' ? 'В процессе' : 'Завершён'}
              </button>
            ))}
          </div>
          <Link to="/school/dashboard" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT }}>
            ← Боевой
          </Link>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10">
        <SelectedCourseView
          course={DEMO_COURSE}
          lessons={DEMO_LESSONS}
          unlockedSortOrders={unlocked}
          completedIds={completed}
          progress={progress}
          pct={pct}
          nextLesson={next}
          onOpen={() => {}}
          t={t}
        />
      </div>
    </div>
  );
}
