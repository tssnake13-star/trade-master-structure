// Telegram Links - легко редактируемые
export const TELEGRAM_LINKS = {
  bot: 'https://tradeliketyo.com/site',
  channel: 'https://t.me/+6utYXa4nAjMyNjNi',
  dm: 'https://t.me/tradeliketyo',
  razbor: 'https://tradeliketyo.com/razbor',
  // 08.10.2026: главный вход «7 дней терминала» идёт через бота, а не сразу на регистрацию,
  // чтобы человек остался в базе бота (Сергей). Бот на ?start=trial присылает кнопку регистрации.
  trial: 'https://tradeliketyo.com/trial',
} as const;

// Сериал «Допуск или отказ» — плейлист на YouTube (Сергей 28.10.2026). Сколько серий вышло, наружу не называть.
export const SERIES_PLAYLIST = 'https://www.youtube.com/playlist?list=PLr1eBwnp9d3lSQHSxs0MgoblTfLz0tTbH';

// Navigation items
export const NAV_ITEMS = [
  { label: 'Для кого', href: '#filter' },
  { label: 'Как устроено', href: '#week' },
  { label: 'Отзывы', href: '#proof' },
  { label: 'Результаты', href: '#stats' },
  { label: 'Сотрудничество', href: '#formats' },
  { label: 'FAQ', href: '#faq' },
] as const;
