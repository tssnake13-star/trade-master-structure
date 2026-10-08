/**
 * Ближайший поток Trade Master Practicum (Сергей 08.10.2026: старт 9 ноября).
 * Дата показывается на сайте только до старта: после неё подписи гаснут сами,
 * и страница снова говорит «напишите, скажу дату ближайшего». Новую дату ставить
 * руками, когда Сергей её назовёт (оффер, раздел 9: дата только настоящая).
 * Баннер в кабинете берёт дату не отсюда, а из настроек сайта (banner_stream_date).
 */
export const NEXT_STREAM_ISO = '2026-11-09';

/** «9 ноября», если поток ещё не стартовал, иначе null */
export function nextStreamLabel(now: Date = new Date()): string | null {
  const start = new Date(`${NEXT_STREAM_ISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || now.getTime() >= start.getTime()) return null;
  return start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}
