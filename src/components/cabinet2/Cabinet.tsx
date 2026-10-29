import '@/styles/cabinet-v2.css';
import { useState, type CSSProperties } from 'react';
import { Menu, MessageCircle } from 'lucide-react';
import DashboardBanners from '@/components/school/DashboardBanners';
import type { Course, Lesson } from '@/pages/SchoolDashboard';
import Room from './Room';
import Sidebar from './Sidebar';
import { CourseView, LockedCourse, ECOSYSTEM_COURSE_ID } from './Study';
import { ActivityCard, CodeCard, ContinueCard, KpiStrip, LiveCard, LockedEcosystemCard, ProgramsCard, RCard, type TFn } from './cards';
import type { JOutcome, JVerdict } from './journal';

type Access = Map<string, { courseId: string; unlocked: number[]; granted_at?: string | null; expires_at?: string | null }>;

export interface CabinetProps {
  t: TFn;
  logo: string;
  isAdmin: boolean;
  isFreeUser: boolean;
  userId?: string;
  name: string;
  email: string;
  initial: string;
  courses: Course[];
  accessMap: Access;
  hasAccess: (c: Course) => boolean;
  expiredAccess: Map<string, Date>;
  progress: Record<string, { completed: number; total: number }>;
  lessonsOf: (id: string) => Lesson[];
  unlockedOf: (c: Course, l: Lesson[]) => number[];
  firstIncomplete: (c: Course, l: Lesson[]) => Lesson | null;
  completedIds: Set<string>;
  mainCourse: Course | null;
  mainProgress: { completed: number; total: number } | null;
  mainNext: Lesson | null;
  programEnd: Date | null;
  daysInSystem: number;
  upcomingLives: Date[];
  recentActivity: { lesson_id: string; completed_at: string; lesson?: Lesson }[];
  eye: { state: 'open' | 'expired' | 'locked' | null; trial: boolean; until: string | null; newCount: number };
  journal: { verdicts: JVerdict[]; outcomes: JOutcome[]; loaded: boolean };
  seenMs: number | null;
  selectedCourse: string | null;
  onSelectCourse: (id: string | null) => void;
  onOpenLesson: (id: string) => void;
  onOpenTerminal: () => void;
  onOpenJournal: () => void;
  onProfile: () => void;
  onAdmin: () => void;
  onSignOut: () => void;
}

const greetingOf = () => {
  const h = new Date(Date.now() + 5 * 3600e3).getUTCHours();
  return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
};
const todayAstana = () => {
  const a = new Date(Date.now() + 5 * 3600e3);
  const wd = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][a.getUTCDay()];
  const mo = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][a.getUTCMonth()];
  return `${wd}, ${a.getUTCDate()} ${mo}`;
};

/**
 * Кабинет v2 (29.10.2026). Стекло, комната с кольцом и анимация — из прототипа, который Сергей принял.
 * После показа вживую: «вкладки… надо убрать… сделать, как в старой версии, слева выбор курсов, кнопка Echo Gate под
 * курсами… в кабинете только два направления — обучение и ECHO-GATE INSIDE терминал. Дневник решений зря вытащил».
 * Поэтому: слева панель (главная, программы, глаз терминала, профиль), справа главная или выбранная программа.
 * Здесь только вид: данные и правила доступа считает SchoolDashboard, как раньше.
 */
export default function Cabinet(p: CabinetProps) {
  const [dim, setDim] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const eyeOpen = p.eye.state === 'open';
  const selected = p.courses.find((c) => c.id === p.selectedCourse) || null;
  const pct = p.mainProgress?.total ? Math.round((p.mainProgress.completed / p.mainProgress.total) * 100) : 0;
  const firstName = (p.name || '').trim().split(/\s+/)[0];
  const trialLeft = p.eye.trial && p.eye.until ? Math.max(1, Math.ceil((new Date(p.eye.until).getTime() - Date.now()) / 86400000)) : p.eye.trial ? 0 : null;
  const showR = eyeOpen && !p.eye.trial && p.journal.outcomes.length > 0;
  // три блока после текущего — в карточку «Продолжить обучение»
  const mainLessons = p.mainCourse ? p.lessonsOf(p.mainCourse.id) : [];
  const mainUnlocked = p.mainCourse ? p.unlockedOf(p.mainCourse, mainLessons) : [];
  const nextIdx = p.mainNext ? mainLessons.findIndex((l) => l.id === p.mainNext!.id) : -1;
  const after = nextIdx < 0 ? [] : mainLessons.slice(nextIdx + 1, nextIdx + 4).map((lesson, k) => {
    const num = nextIdx + 2 + k;
    return { lesson, num, open: mainUnlocked.includes(num) };
  });

  const pick = (id: string | null) => {
    p.onSelectCourse(id);
    setSideOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <div className="cv2">
      <Room />
      <div className="cv2-page">
        <div className="cv2-shell">
          <Sidebar
            logo={p.logo} t={p.t} courses={p.courses} hasAccess={p.hasAccess} expiredAccess={p.expiredAccess} progress={p.progress}
            selected={p.selectedCourse} onHome={() => pick(null)} onSelect={(id) => pick(id)}
            eye={{ state: p.eye.state, newCount: p.eye.newCount }} trialLeft={trialLeft}
            onEye={() => (p.eye.newCount > 0 ? p.onOpenJournal() : p.onOpenTerminal())}
            name={p.name} email={p.email} initial={p.initial} isFreeUser={p.isFreeUser} isAdmin={p.isAdmin}
            onProfile={p.onProfile} onAdmin={p.onAdmin} onSignOut={p.onSignOut}
            open={sideOpen} onClose={() => setSideOpen(false)}
          />

          <main className="cv2-main">
            <header className="cv2-top cv2-glass">
              <button type="button" className="cv2-icon-btn cv2-menu-btn" onClick={() => setSideOpen(true)} aria-label="Открыть меню"><Menu size={17} /></button>
              <span className="cv2-chip"><span className="cv2-live" />{todayAstana()}</span>
              <span className="cv2-chip">{p.isFreeUser ? p.t('header_status_intro') : p.t('header_status_live')}</span>
              <a className="cv2-btn cv2-btn-ghost" style={{ marginLeft: 'auto', padding: '7px 13px', fontSize: 13 }} href="https://t.me/tradeliketyo" target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} /> {p.t('header_support')}
              </a>
            </header>

            {/* смена экрана: главная ↔ программа собирается заново по частям */}
            <div key={p.selectedCourse || 'home'}>
              {!selected && (
                <>
                  <div className="cv2-hello">
                    <div className="cv2-in" style={{ '--i': 0 } as CSSProperties}>
                      <h1 className="cv2-h1">{greetingOf()}{firstName ? `, ${firstName}` : ''}</h1>
                      <p>
                        {p.mainCourse && p.mainProgress?.total
                          ? <>Вы прошли <b>{pct}%</b> программы {p.mainCourse.title}{p.mainNext ? <>, дальше блок «{p.mainNext.title}»</> : null}.</>
                          : p.isFreeUser ? p.t('free_hero_title') : null}
                        {eyeOpen && p.eye.newCount > 0 && <> В терминале новых решений: <b>{p.eye.newCount}</b>.</>}
                      </p>
                    </div>
                  </div>
                  <DashboardBanners accessMap={p.accessMap} />
                  <div className={`cv2-grid${dim ? ' dim' : ''}`}>
                    <ContinueCard course={p.mainCourse} progress={p.mainProgress} next={p.mainNext} after={showR ? after : []} onOpen={p.onOpenLesson}
                      onCourse={() => p.mainCourse && pick(p.mainCourse.id)} t={p.t} i={1} />
                    {showR ? <RCard outcomes={p.journal.outcomes} onDim={setDim} i={2} /> : <LiveCard upcoming={p.upcomingLives} i={2} span="s7" />}
                    {!p.isFreeUser && <KpiStrip daysInSystem={p.daysInSystem} programEnd={p.programEnd} progress={p.mainProgress} i={3} />}
                    <ProgramsCard courses={p.courses} hasAccess={p.hasAccess} progress={p.progress} expiredAccess={p.expiredAccess}
                      onSelect={(id) => pick(id)} i={7} span={showR ? 's8' : 's12'} />
                    {showR && <LiveCard upcoming={p.upcomingLives} i={8} />}
                    {!eyeOpen && <LockedEcosystemCard expired={p.eye.state === 'expired'} i={9} />}
                    <ActivityCard items={p.recentActivity} t={p.t} i={10} span={eyeOpen ? 's6' : 's4'} />
                    <CodeCard userId={p.userId} t={p.t} i={11} span={eyeOpen ? 's6' : 's12'} />
                  </div>
                </>
              )}

              {selected && (
                <div style={{ marginTop: 22 }}>
                  {p.hasAccess(selected) ? (
                    <CourseView course={selected} lessons={p.lessonsOf(selected.id)} unlocked={p.unlockedOf(selected, p.lessonsOf(selected.id))}
                      completedIds={p.completedIds} progress={p.progress[selected.id] || { completed: 0, total: 0 }} onOpenLesson={p.onOpenLesson}
                      onOpenEcosystem={() => pick(ECOSYSTEM_COURSE_ID)} t={p.t} />
                  ) : (
                    <LockedCourse course={selected} expiredAt={p.expiredAccess.get(selected.id)} t={p.t} />
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
