// Цифры под блоком автора (StatsCounter). 20.10.2026: один список на сайт и вкладку «Цены» терминала школьного бота.
// Win Rate и R:R — таблица «TLT_Statement_2025-2026» (январь 2025 — октябрь 2026):
// побед 23,1%, средний выигрыш +9,55 R против −1,00 R.
export const AUTHOR_STATS: { value: number; suffix: string; label: string; decimals?: number }[] = [
  { value: 15, suffix: '', label: 'лет в рынке' },
  { value: 200, suffix: '+', label: 'учеников в системе' },
  { value: 1000, suffix: '+', label: 'эталонных сделок в архиве' },
  { value: 23.1, suffix: '%', label: 'Win Rate при среднем R:R 9,5:1', decimals: 1 },
];
