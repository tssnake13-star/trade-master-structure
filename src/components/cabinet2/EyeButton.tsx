import { Lock } from 'lucide-react';

/** Глаз как в lucide Eye: веко и зрачок отдельными фигурами — моргает только веко со зрачком, рамка стоит */
export const EYE_PATH = 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0';

/**
 * Кнопка терминала «ECHO-GATE INSIDE · глаз системы» (29.10.2026, Сергей: «Терминал должен быть также кнопкой
 * отдельно с анимацией… с глазом… как сейчас, мне нравится»). Живой глаз как в прежнем кабинете: моргает раз
 * в 7 с, зрачок светится, по рамке медленно бежит луч, на кнопке — сколько новых решений в журнале.
 * Без доступа — замок и никуда не ведёт.
 */
export default function EyeButton({
  open,
  expired,
  trialLeft,
  newCount,
  onClick,
  wide = false,
}: {
  open: boolean;
  expired?: boolean;
  /** пробный доступ: сколько дней осталось (0 — пробный без даты) */
  trialLeft?: number | null;
  newCount: number;
  onClick: () => void;
  /** во всю ширину левой панели кабинета */
  wide?: boolean;
}) {
  const word = (n: number) => (n === 1 ? 'день' : n < 5 ? 'дня' : 'дней');
  return (
    <button type="button" className={`cv2-eye-btn${wide ? ' wide' : ''}`} onClick={onClick} disabled={!open} aria-label="Открыть терминал ECHO-GATE INSIDE">
      {open ? (
        <svg className="cv2-eye" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={EYE_PATH} />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <Lock size={28} strokeWidth={1.5} style={{ color: 'var(--faint)', flexShrink: 0 }} aria-hidden="true" />
      )}
      <span className="cv2-eye-t">
        <b>ECHO-GATE INSIDE</b>
        <small>глаз системы</small>
        {expired && <em style={{ color: 'var(--mut)' }}>доступ закончился</em>}
        {open && trialLeft != null && (
          <em>{trialLeft > 0 ? `пробный · ${trialLeft === 1 ? 'остался' : 'осталось'} ${trialLeft} ${word(trialLeft)}` : 'пробный доступ'}</em>
        )}
      </span>
      {open && <span className="cv2-orbit" aria-hidden="true" />}
      {open && newCount > 0 && <span className="cv2-badge" title={`Новых решений: ${newCount}`}>{newCount}</span>}
    </button>
  );
}
