import { Home, Lock, LogOut, Settings } from 'lucide-react';
import type { Course } from '@/pages/SchoolDashboard';
import EyeButton from './EyeButton';
import type { TFn } from './cards';

/**
 * Левая панель кабинета v2 (29.10.2026, Сергей: «вернуть слева… все курсы, как было, под ним кнопка Echo Gate…
 * в кабинете только два направления: обучение и ECHO-GATE INSIDE терминал»). Главная, программы с прогрессом
 * и замком, под ними кнопка терминала с живым глазом; внизу профиль, шестерёнка админки — одним нажатием, выход.
 */
export default function Sidebar({
  logo, t, courses, hasAccess, expiredAccess, progress, selected, onHome, onSelect,
  eye, trialLeft, onEye, name, email, initial, isFreeUser, isAdmin, onProfile, onAdmin, onSignOut, open, onClose,
}: {
  logo: string;
  t: TFn;
  courses: Course[];
  hasAccess: (c: Course) => boolean;
  expiredAccess: Map<string, Date>;
  progress: Record<string, { completed: number; total: number }>;
  selected: string | null;
  onHome: () => void;
  onSelect: (id: string) => void;
  eye: { state: 'open' | 'expired' | 'locked' | null; newCount: number };
  trialLeft: number | null;
  onEye: () => void;
  name: string;
  email: string;
  initial: string;
  isFreeUser: boolean;
  isAdmin: boolean;
  onProfile: () => void;
  onAdmin: () => void;
  onSignOut: () => void;
  open: boolean;
  onClose: () => void;
}) {
  // курсы с доступом сверху, закрытые с замком снизу (как в прежнем кабинете, 12.10.2026)
  const list = [...courses].sort((a, b) => Number(hasAccess(b)) - Number(hasAccess(a)));
  return (
    <>
      {open && <div className="cv2-side-veil" onClick={onClose} aria-hidden="true" />}
      <aside className={`cv2-side cv2-glass${open ? ' open' : ''}`} aria-label="Кабинет">
        <button type="button" className="cv2-brand" onClick={onHome} aria-label="Кабинет, главная">
          <video src={logo} autoPlay loop muted playsInline style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', background: '#000' }} />
          <span><b>TRADE LIKE TYO</b><small>Кабинет</small></span>
        </button>

        <button type="button" className="cv2-side-item" aria-current={selected === null || undefined} onClick={onHome}>
          <Home size={16} /> <span>{t('sidebar_home')}</span>
        </button>

        <div className="cv2-side-label">{t('sidebar_programs_label')}</div>
        <nav className="cv2-side-list">
          {list.map((c) => {
            const ok = hasAccess(c), p = progress[c.id] || { completed: 0, total: 0 };
            const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
            return (
              <button key={c.id} type="button" className="cv2-side-item course" aria-current={selected === c.id || undefined}
                data-locked={!ok || undefined} title={c.title} onClick={() => onSelect(c.id)}>
                <span className="row"><span className="tt">{c.title}</span>{!ok && <Lock size={13} />}</span>
                {ok && p.total > 0 && (
                  <>
                    <span className="cv2-progress" style={{ display: 'block', marginTop: 7 }}><i style={{ width: `${pct}%` }} /></span>
                    <span className="sub num">{p.completed}/{p.total}</span>
                  </>
                )}
                {!ok && <span className="sub">{expiredAccess.has(c.id) ? t('sidebar_locked_expired') : t('sidebar_locked')}</span>}
              </button>
            );
          })}
        </nav>

        {/* ECHO-GATE INSIDE — второе направление кабинета: терминал отдельным экраном, кнопка с живым глазом */}
        {eye.state && (
          <div style={{ marginTop: 12 }}>
            <EyeButton wide open={eye.state === 'open'} expired={eye.state === 'expired'} trialLeft={eye.state === 'open' ? trialLeft : null}
              newCount={eye.state === 'open' ? eye.newCount : 0} onClick={onEye} />
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div className="cv2-side-me">
          <button type="button" className="who" onClick={onProfile} title="Профиль и пароль">
            <span className="cv2-ava">{initial}</span>
            <span style={{ minWidth: 0 }}>
              <b>{name || email || t('sidebar_default_name')}</b>
              <small>{isFreeUser ? t('sidebar_status_intro') : t('sidebar_status_active')}</small>
            </span>
          </button>
          {isAdmin && (
            <button type="button" className="cv2-icon-btn" onClick={onAdmin} title="Админка" aria-label="Админка"><Settings size={17} /></button>
          )}
        </div>
        <button type="button" className="cv2-side-out" onClick={onSignOut}><LogOut size={14} /> {t('sidebar_signout')}</button>
      </aside>
    </>
  );
}
