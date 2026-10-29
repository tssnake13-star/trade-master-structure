import '@/styles/cabinet-v2.css';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LogOut, MessageCircle, Settings, UserRound } from 'lucide-react';
import DashboardBanners from '@/components/school/DashboardBanners';
import type { Course, Lesson } from '@/pages/SchoolDashboard';
import Room from './Room';
import DropGroup from './DropGroup';
import EyeButton from './EyeButton';
import Study from './Study';
import { ActivityCard, CodeCard, ContinueCard, KpiStrip, LiveCard, LockedEcosystemCard, ProgramsCard, RCard, VerdictRows, VerdictsCard, type TFn } from './cards';
import type { JOutcome, JVerdict } from './journal';

type View = 'home' | 'study' | 'journal';
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
const plural = (n: number, one: string, few: string, many: string) => {
  const d = n % 10, h = n % 100;
  return d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
};

/**
 * Кабинет v2 (29.10.2026). Сергей принял прототип: «мне нравится… прозрачные окна, там прикольно»; «кабинет и
 * терминал — это два разных… терминал должен быть кнопкой отдельно с анимацией, с глазом, как сейчас».
 * Здесь только вид: все данные и правила доступа считает SchoolDashboard, как раньше.
 */
export default function Cabinet(p: CabinetProps) {
  const [view, setView] = useState<View>(p.selectedCourse ? 'study' : 'home');
  const [leaving, setLeaving] = useState(false);
  const [dim, setDim] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const eyeOpen = p.eye.state === 'open';

  useEffect(() => { if (p.selectedCourse) setView('study'); }, [p.selectedCourse]);
  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [menu]);

  // смена вкладки: старая уходит в размытие (220 мс), новая собирается по частям
  const go = (v: View) => {
    if (v === view) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setView(v);
      if (v === 'home') p.onSelectCourse(null);
      if (v === 'study' && !p.selectedCourse && p.mainCourse) p.onSelectCourse(p.mainCourse.id);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, reduce ? 0 : 220);
  };

  const selected = p.courses.find((c) => c.id === p.selectedCourse) || null;
  const pct = p.mainProgress?.total ? Math.round((p.mainProgress.completed / p.mainProgress.total) * 100) : 0;
  const firstName = (p.name || '').trim().split(/\s+/)[0];
  const trialLeft = p.eye.trial && p.eye.until ? Math.max(1, Math.ceil((new Date(p.eye.until).getTime() - Date.now()) / 86400000)) : p.eye.trial ? 0 : null;
  const week = p.journal.verdicts.filter((v) => Date.now() - new Date(v.time).getTime() < 7 * 86400000);
  const wOk = week.filter((v) => v.verdict === 'ДОПУСК').length;

  return (
    <div className="cv2">
      <Room />
      <div className="cv2-page">
        <div className="cv2-wrap">
          <header className="cv2-bar cv2-glass">
            <button type="button" className="cv2-brand" onClick={() => go('home')} aria-label="Кабинет, главная">
              <video src={p.logo} autoPlay loop muted playsInline style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', background: '#000' }} />
              <span><b>TRADE LIKE TYO</b><small>Кабинет</small></span>
            </button>
            <DropGroup<View> role="tablist" label="Разделы кабинета" className="cv2-tabs" value={view} onChange={go}
              items={[
                { key: 'home', label: 'Главная' },
                { key: 'study', label: 'Обучение' },
                { key: 'journal', label: 'Дневник решений', hidden: !eyeOpen },
              ]} />
            <div className="cv2-actions">
              {p.eye.state && (
                <EyeButton open={eyeOpen} expired={p.eye.state === 'expired'} trialLeft={eyeOpen ? trialLeft : null}
                  newCount={eyeOpen ? p.eye.newCount : 0} onClick={() => (p.eye.newCount > 0 ? p.onOpenJournal() : p.onOpenTerminal())} />
              )}
              <a className="cv2-icon-btn" href="https://t.me/tradeliketyo" target="_blank" rel="noopener noreferrer" aria-label="Написать в поддержку" title={p.t('header_support')}>
                <MessageCircle size={16} />
              </a>
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button type="button" className="cv2-ava" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Профиль">{p.initial}</button>
                {menu && (
                  <div className="cv2-menu cv2-glass" role="menu">
                    <div className="who"><b>{p.name || p.email || p.t('sidebar_default_name')}</b>{p.isFreeUser ? p.t('sidebar_status_intro') : p.t('sidebar_status_active')}</div>
                    <button type="button" role="menuitem" onClick={p.onProfile}><UserRound size={15} />Профиль и пароль</button>
                    {p.isAdmin && <button type="button" role="menuitem" onClick={p.onAdmin}><Settings size={15} />Админка</button>}
                    <button type="button" role="menuitem" onClick={p.onSignOut}><LogOut size={15} />{p.t('sidebar_signout')}</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div key={view} className={`cv2-view${leaving ? ' out' : ''}`}>
            {view === 'home' && (
              <>
                <div className="cv2-hello">
                  <div className="cv2-in" style={{ '--i': 0 } as CSSProperties}>
                    <div className="cv2-chips">
                      <span className="cv2-chip"><span className="cv2-live" />{todayAstana()}</span>
                      <span className="cv2-chip">{p.isFreeUser ? p.t('header_status_intro') : p.t('header_status_live')}</span>
                    </div>
                    <h1 className="cv2-h1">{greetingOf()}{firstName ? `, ${firstName}` : ''}</h1>
                    <p>
                      {p.mainCourse && p.mainProgress?.total
                        ? <>Вы прошли <b>{pct}%</b> программы {p.mainCourse.title}{p.mainNext ? <>, дальше блок «{p.mainNext.title}»</> : null}.</>
                        : p.isFreeUser ? p.t('free_hero_title') : null}
                      {eyeOpen && week.length > 0 && <> За неделю я дал <b>{wOk} {plural(wOk, 'допуск', 'допуска', 'допусков')}</b> и <b>{week.length - wOk} {plural(week.length - wOk, 'отказ', 'отказа', 'отказов')}</b>.</>}
                      {eyeOpen && p.eye.newCount > 0 && <> В журнале новое: <b>{p.eye.newCount}</b>.</>}
                    </p>
                  </div>
                </div>
                <DashboardBanners accessMap={p.accessMap} />
                <div className={`cv2-grid${dim ? ' dim' : ''}`}>
                  <ContinueCard course={p.mainCourse} progress={p.mainProgress} next={p.mainNext} onOpen={p.onOpenLesson} t={p.t} i={1} />
                  {eyeOpen && !p.eye.trial && p.journal.outcomes.length > 0
                    ? <RCard outcomes={p.journal.outcomes} onDim={setDim} i={2} />
                    : <LiveCard upcoming={p.upcomingLives} i={2} span="s7" />}
                  {!p.isFreeUser && <KpiStrip daysInSystem={p.daysInSystem} programEnd={p.programEnd} progress={p.mainProgress} i={3} />}
                  {eyeOpen
                    ? <VerdictsCard items={p.journal.verdicts} trial={p.eye.trial} seenMs={p.seenMs} onOpenJournal={p.onOpenJournal} i={7} />
                    : <LockedEcosystemCard expired={p.eye.state === 'expired'} i={7} />}
                  {eyeOpen && !p.eye.trial && p.journal.outcomes.length > 0
                    ? <LiveCard upcoming={p.upcomingLives} i={8} />
                    : <CodeCard userId={p.userId} t={p.t} i={8} />}
                  <ProgramsCard courses={p.courses} hasAccess={p.hasAccess} progress={p.progress} expiredAccess={p.expiredAccess}
                    onSelect={(id) => { p.onSelectCourse(id); go('study'); }} i={9} />
                  <ActivityCard items={p.recentActivity} t={p.t} i={10} />
                  {eyeOpen && !p.eye.trial && p.journal.outcomes.length > 0 && <CodeCard userId={p.userId} t={p.t} i={11} span="s12" />}
                </div>
              </>
            )}

            {view === 'study' && (
              <>
                <div className="cv2-hello"><div className="cv2-in" style={{ '--i': 0 } as CSSProperties}>
                  <h1 className="cv2-h1">Обучение</h1>
                  <p>Блоки открываются по порядку: следующий — после того, как вы завершили предыдущий.</p>
                </div></div>
                <Study courses={p.courses} selected={selected} onSelect={(id) => p.onSelectCourse(id)} hasAccess={p.hasAccess} expiredAccess={p.expiredAccess}
                  progress={p.progress} lessonsOf={p.lessonsOf} unlockedOf={p.unlockedOf} completedIds={p.completedIds} onOpenLesson={p.onOpenLesson} t={p.t} />
              </>
            )}

            {view === 'journal' && eyeOpen && (
              <>
                <div className="cv2-hello"><div className="cv2-in" style={{ '--i': 0 } as CSSProperties}>
                  <h1 className="cv2-h1">Дневник решений</h1>
                  <p>Каждое моё решение записано до того, как цена пошла: беру или не беру, и почему. Убытки тоже.{p.eye.trial ? ' В пробном доступе решения видны с задержкой в 3 дня.' : ''}</p>
                </div></div>
                <div className="cv2-grid">
                  <article className="cv2-card cv2-glass s12 cv2-in" style={{ '--i': 1 } as CSSProperties}>
                    <VerdictRows items={p.journal.verdicts} seenMs={p.seenMs} />
                    <button type="button" className="cv2-btn cv2-btn-brass" style={{ marginTop: 14 }} onClick={p.onOpenJournal}>Открыть журнал в терминале</button>
                  </article>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
