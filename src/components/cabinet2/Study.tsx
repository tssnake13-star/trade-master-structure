import { useState, type CSSProperties } from 'react';
import { ArrowRight, Lock, MessageCircle } from 'lucide-react';
import RichText from '@/components/RichText';
import type { Course, Lesson } from '@/pages/SchoolDashboard';
import { EYE_PATH } from './EyeButton';
import type { TFn } from './cards';

const DM = 'https://t.me/tradeliketyo';
// курс-экосистема: из других курсов мост ведёт сюда, а в нём самом — в Telegram (как в прежнем кабинете)
export const ECOSYSTEM_COURSE_ID = '7280015b-be5f-4569-b6ea-0bbb69fc06ee';

/**
 * «Обучение» в кабинете v2 (29.10.2026): слева программы, справа блоки выбранной программы лестницей.
 * Логика блоков прежняя: открыт — можно войти, пройден — повторить, закрыт — подсказка, что нужно (замок вздрагивает).
 */
export default function Study({
  courses, selected, onSelect, hasAccess, expiredAccess, progress, lessonsOf, unlockedOf, completedIds, onOpenLesson, t,
}: {
  courses: Course[];
  selected: Course | null;
  onSelect: (id: string) => void;
  hasAccess: (c: Course) => boolean;
  expiredAccess: Map<string, Date>;
  progress: Record<string, { completed: number; total: number }>;
  lessonsOf: (id: string) => Lesson[];
  unlockedOf: (c: Course, l: Lesson[]) => number[];
  completedIds: Set<string>;
  onOpenLesson: (id: string) => void;
  t: TFn;
}) {
  const list = [...courses].sort((a, b) => Number(hasAccess(b)) - Number(hasAccess(a)));
  return (
    <div className="cv2-grid">
      <aside className="cv2-card cv2-glass s4 cv2-in" style={{ '--i': 1, alignSelf: 'start' } as CSSProperties}>
        <h3>Программы</h3>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {list.map((c) => {
            const ok = hasAccess(c), p = progress[c.id] || { completed: 0, total: 0 };
            const on = selected?.id === c.id;
            return (
              <button key={c.id} type="button" className="cv2-prog" data-locked={!ok || undefined} onClick={() => onSelect(c.id)}
                style={on ? { borderColor: 'rgba(205,170,110,.55)', background: 'rgba(205,170,110,.08)' } : undefined} aria-current={on || undefined}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b>{c.title}</b>{!ok && <Lock size={14} style={{ color: 'var(--faint)' }} />}</span>
                <span className="cv2-sub" style={{ display: 'block' }}>
                  {ok ? (p.total ? `${p.completed} из ${p.total}` : '') : expiredAccess.has(c.id) ? t('sidebar_locked_expired') : t('sidebar_locked')}
                </span>
                {ok && p.total > 0 && <span className="cv2-progress" style={{ display: 'block', marginTop: 8 }}><i style={{ width: `${Math.round((p.completed / p.total) * 100)}%` }} /></span>}
              </button>
            );
          })}
        </div>
      </aside>
      <section className="s8" style={{ minWidth: 0 }}>
        {selected && hasAccess(selected) ? (
          <CourseView key={selected.id} course={selected} lessons={lessonsOf(selected.id)} unlocked={unlockedOf(selected, lessonsOf(selected.id))}
            completedIds={completedIds} progress={progress[selected.id] || { completed: 0, total: 0 }} onOpenLesson={onOpenLesson}
            onOpenEcosystem={() => onSelect(ECOSYSTEM_COURSE_ID)} t={t} />
        ) : selected ? (
          <LockedCourse course={selected} expiredAt={expiredAccess.get(selected.id)} t={t} />
        ) : (
          <div className="cv2-card cv2-glass cv2-in"><p className="cv2-sub">Выберите программу слева.</p></div>
        )}
      </section>
    </div>
  );
}

function CourseView({ course, lessons, unlocked, completedIds, progress, onOpenLesson, onOpenEcosystem, t }: {
  course: Course; lessons: Lesson[]; unlocked: number[]; completedIds: Set<string>; progress: { completed: number; total: number };
  onOpenLesson: (id: string) => void; onOpenEcosystem: () => void; t: TFn;
}) {
  const [nudge, setNudge] = useState<{ id: string; n: number } | null>(null);
  const pct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const current = lessons.findIndex((l, i) => unlocked.includes(i + 1) && !completedIds.has(l.id));
  const allOpen = !course.is_free && lessons.length > 0 && lessons.every((_, i) => unlocked.includes(i + 1));
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <article className="cv2-card cv2-glass cv2-in" style={{ '--i': 2 } as CSSProperties}>
      <h2 style={{ margin: 0, fontSize: 'clamp(26px, 2.6vw, 34px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{course.title}</h2>
      {course.subtitle && <p className="cv2-sub" style={{ fontSize: 14, marginTop: 6, maxWidth: '62ch' }}>{course.subtitle}</p>}
      {progress.total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
          <div className="cv2-progress" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--mut)' }}>{progress.completed}/{progress.total} · {pct}%</span>
        </div>
      )}
      <div className="cv2-steps">
        {lessons.map((l, i) => {
          const num = i + 1, done = completedIds.has(l.id), open = unlocked.includes(num), now = i === current;
          const cls = done ? 'done' : now ? 'now' : open ? 'open' : 'lock';
          const shake = nudge?.id === l.id;
          return (
            <button key={l.id} type="button" className={`cv2-step ${cls} cv2-in`} style={{ '--i': Math.min(i, 8) + 3 } as CSSProperties}
              aria-disabled={!done && !open} onClick={() => (done || open ? onOpenLesson(l.id) : setNudge({ id: l.id, n: Date.now() }))}>
              <span className="n">{done ? '✓' : open ? pad(num) : <Lock key={shake ? nudge?.n : 0} size={14} className={shake ? 'cv2-shake' : undefined} />}</span>
              <span style={{ minWidth: 0 }}>
                <small key={shake ? `h${nudge?.n}` : 'h'} style={shake ? { color: 'var(--brass)' } : undefined}>
                  Блок {pad(num)}{done ? ' · пройден' : now ? ' · сейчас' : open ? '' : ` · ${course.is_free ? t('course_lesson_locked_prev') : t('course_lesson_locked_mentor')}`}
                </small>
                <b>{l.title}</b>
                {now && l.description && (
                  <RichText text={l.description} style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--soft)', marginTop: 6, maxWidth: '58ch' }} gap="0.5em" />
                )}
              </span>
              <span className="go">{done ? t('course_lesson_repeat') : open ? <>{t('course_lesson_open')} <ArrowRight size={13} style={{ verticalAlign: '-2px' }} /></> : null}</span>
            </button>
          );
        })}
      </div>
      {allOpen && (
        <div className="cv2-in" style={{ '--i': 10, marginTop: 16, padding: '20px 22px', borderRadius: 16, border: '1px solid rgba(205,170,110,.5)', background: 'radial-gradient(120% 120% at 50% 0%, rgba(205,170,110,.12), transparent 65%)' } as CSSProperties}>
          {course.id === ECOSYSTEM_COURSE_ID ? (
            <>
              <h3 style={{ margin: 0, fontSize: 20, lineHeight: 1.35 }}>Школа учит принимать решения самому. ECHO-GATE INSIDE смотрит рынок за вас: от вас 2 действия.</h3>
              <p className="cv2-sub" style={{ marginTop: 8 }}>Hunter_Bot и Risk Sentinel — роботы исполнения на вашем счёте.</p>
              <a className="cv2-btn cv2-btn-brass" style={{ marginTop: 14 }} href="/binocular" target="_blank" rel="noopener noreferrer">Хочу в экосистему <ArrowRight size={15} /></a>
            </>
          ) : (
            <>
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                <path d={EYE_PATH} /><circle cx="12" cy="12" r="3" />
              </svg>
              <h3 style={{ margin: '8px 0 0', fontSize: 20 }}>Курс пройден. Дальше ECHO-GATE INSIDE.</h3>
              <p className="cv2-sub" style={{ marginTop: 6, maxWidth: '58ch' }}>Все блоки пройдены. Дальше можно подключить ECHO-GATE INSIDE: терминал, мой вердикт по каждому допуску и роботы на вашем счёте.</p>
              <button type="button" className="cv2-btn cv2-btn-brass" style={{ marginTop: 14 }} onClick={onOpenEcosystem}>Перейти в экосистему <ArrowRight size={15} /></button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function LockedCourse({ course, expiredAt, t }: { course: Course; expiredAt?: Date; t: TFn }) {
  const date = expiredAt ? expiredAt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  return (
    <article className="cv2-card cv2-glass cv2-in" style={{ textAlign: 'center', padding: '56px 24px' }}>
      <Lock size={26} style={{ color: expiredAt ? 'var(--brass)' : 'var(--faint)' }} />
      <div className="cv2-sub" style={{ marginTop: 12 }}>{course.title}</div>
      <h2 style={{ margin: '8px 0 0', fontSize: 28, letterSpacing: '-0.03em' }}>{expiredAt ? t('locked_expired_title') : t('locked_unpaid_title')}</h2>
      <p style={{ color: 'var(--soft)', margin: '10px auto 0', maxWidth: '46ch' }}>{expiredAt ? t('locked_expired_text', { date }) : t('locked_unpaid_text')}</p>
      <a className="cv2-btn cv2-btn-brass" style={{ marginTop: 18 }} href={DM} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={15} /> {expiredAt ? t('locked_expired_cta') : t('locked_unpaid_cta')}
      </a>
    </article>
  );
}
