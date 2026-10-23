/**
 * Облик сайта, шаг 2 (23.10.2026, Сергей: «Ставь, и начинай второй шаг»): два шрифта вместо шести
 * и цвета со снимка первого экрана (план «Облик TRADELIKETYO»).
 *
 * Пока Сергей смотрит пробу, новый вид включается только адресом с ?v3: класс html.look-v3
 * (стили — styles/look-v3.css) и шрифты Literata и Onest, которые остальным посетителям не грузятся.
 * После его «ставь» правила переезжают в основные стили, лишние шрифты снимаются, этот файл удаляется.
 */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..600&family=Onest:wght@400..700&display=swap';

export const V3 = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('v3');

// класс ставится до первой отрисовки: модуль грузится раньше, чем React рисует страницу
if (V3) {
  document.documentElement.classList.add('look-v3');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONTS;
  document.head.appendChild(link);
}
