/**
 * Тарифы учеников — общий справочник для админки.
 *
 * Тариф хранится в `profiles.tariff` и живёт отдельно от доступов к курсам:
 * доступ говорит, какие материалы открыты, тариф — что человек купил. Один и
 * тот же набор курсов бывает выдан на разных условиях, поэтому по course_access
 * тариф не восстанавливается.
 *
 * `weight` задаёт порядок сортировки в списке аккаунтов: старшие тарифы выше.
 */

export type TariffKey = 'vip' | 'trade_os_plus' | 'practicum' | 'trade_system' | 'ecosystem';

export const TARIFFS: { key: TariffKey; label: string; weight: number; color: string }[] = [
  { key: 'vip',           label: 'VIP',           weight: 5, color: '#e1a84d' },
  { key: 'trade_os_plus', label: 'Trade OS Plus', weight: 4, color: '#c4904a' },
  { key: 'practicum',     label: 'Практикум',     weight: 3, color: '#8aa6d6' },
  { key: 'trade_system',  label: 'Trade System',  weight: 2, color: '#7a9a7a' },
  { key: 'ecosystem',     label: 'Экосистема',    weight: 1, color: '#8a7048' },
];

export function tariffLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return TARIFFS.find(t => t.key === key)?.label ?? key;
}

export function tariffColor(key: string | null | undefined): string {
  if (!key) return '#555';
  return TARIFFS.find(t => t.key === key)?.color ?? '#8a8478';
}

export function tariffWeight(key: string | null | undefined): number {
  if (!key) return 0;
  return TARIFFS.find(t => t.key === key)?.weight ?? 0;
}

/**
 * «сегодня» / «вчера» / «5 дней назад» / дата.
 * Точное время не нужно: в списке важно, давно ли человек заходил.
 */
export function lastSeenLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const seen = new Date(iso);
  if (Number.isNaN(seen.getTime())) return null;

  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const days = Math.round((startOfDay(new Date()).getTime() - startOfDay(seen).getTime()) / 86400000);

  if (days <= 0) return 'заходил сегодня';
  if (days === 1) return 'заходил вчера';
  if (days < 7) return `заходил ${days} дн. назад`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `заходил ${weeks} нед. назад`;
  }
  return `заходил ${seen.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
}
