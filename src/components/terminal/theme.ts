import type { CSSProperties } from 'react';

// Общая палитра терминала — та же, что у кабинета школы: тёмный фон,
// золотой акцент. Зелёный и красный — те же, что на картинках бота.
export const ACCENT = '#e1a84d';
export const BG = '#080808';
export const FG = '#e8e0d0';
export const CARD = '#141210';
export const BORDER = '#232323';
export const DIM = '#8a8175';
export const UP = '#3fb98f';
export const DOWN = '#e0604f';
export const MONO = "'Space Mono', ui-monospace, monospace";
export const SANS = "'Syne', system-ui, sans-serif";

export const DISCLAIMER = 'Не является инвестиционной рекомендацией — решение всегда за вами.';

export const label: CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#6f6a62',
};

export const card: CSSProperties = {
  backgroundColor: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
};

export const pill = (on: boolean): CSSProperties => ({
  padding: '6px 11px',
  borderRadius: 7,
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: on ? '#0a0a0a' : DIM,
  backgroundColor: on ? ACCENT : 'transparent',
  border: `1px solid ${on ? ACCENT : BORDER}`,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
