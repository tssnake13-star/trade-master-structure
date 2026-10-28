/** Страницы сайта (28.10.2026): шапка, подвал и «Куда дальше» берут их отсюда. */
export const SITE_PAGES = [
  { to: '/', label: 'Главная' },
  { to: '/binocular', label: 'Бинокль' },
  { to: '/microscope', label: 'Микроскоп' },
  { to: '/author', label: 'Об авторе' },
] as const;

export type SitePath = (typeof SITE_PAGES)[number]['to'];
