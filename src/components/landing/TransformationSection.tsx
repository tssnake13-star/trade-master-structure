/**
 * «03 · Неделя по системе» (файл прежний — TransformationSection).
 *
 * ⚠️ Переписан 13.09.2026 под «ПОРТРЕТ КЛИЕНТА.md». Это главное объяснение
 * УТП простым языком: как свинг-торговля помещается рядом с основной работой.
 * Три шага недели — факты из FAQ автора (выходные 30–60 минут, в будни
 * короткая проверка, выход и стоп известны до входа — это «Где выходить»
 * из четырёх вопросов). Минуты на будничную проверку НЕ называем:
 * число не подтверждено.
 *
 * Здесь «что», а не «как»: ни одного условия входа по содержанию.
 *
 * id секции сменён с `transformation` на `week` — прежняя аналитика по старому
 * блоку остаётся в базе под старым id.
 *
 * 11.10.2026, Сергей: «весь сайт должен говорить об одном… попробуй мою систему, не изучая её».
 * Блок показывал неделю того, кто торгует по системе сам (второй путь), а ссылка «Как устроено»
 * в шапке и вторая кнопка первого экрана ведут сюда. Теперь здесь неделя подписчика ECHO-GATE
 * INSIDE: терминал и вердикт, 2 действия, советник. Неделя самостоятельной работы живёт
 * в ответах на вопросы («Можно ли совмещать с основной работой?»).
 */

import { useCallback, useRef } from 'react';
import CurvedMonitor from './CurvedMonitor';
import Words from '@/components/fx/Words';

// 28.10.2026 (страница «Бинокль»): шаги простыми словами — программа, вы, робот и страж счёта
const WEEK = [
  {
    when: 'Программа, каждый день',
    title: 'Находит сделку',
    text: 'Проверяет рынок по одним и тем же правилам и пропускает сделку или отказывает ей. Мой вердикт с причиной приходит сразу: в программу и в Telegram.',
  },
  {
    when: 'Ваши 2 действия',
    title: 'Место входа и кнопка',
    text: 'Отмечаете, где войти, и нажимаете кнопку. Где ставить место входа, объясняет один урок.',
  },
  {
    when: 'Сделка живёт днями',
    title: 'Дальше ведёт Hunter_Bot',
    text: 'Робот-исполнитель Hunter_Bot входит, ставит стоп и тейк, переводит сделку в ноль. Лимиты держит Risk Sentinel, страж счёта, следить за каждым движением не нужно.',
  },
];

const TransformationSection = () => {
  // 22.10.2026: над шагами — живое окно терминала; шаг, который сейчас показывается, подсвечен.
  // Меняем атрибуты напрямую, без перерисовки React в каждом кадре.
  const stepsRef = useRef<HTMLDivElement>(null);
  const onPhase = useCallback((phase: number, progress: number) => {
    const cards = stepsRef.current?.children;
    if (!cards) return;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i] as HTMLElement;
      const on = i === phase ? '1' : '0';
      if (c.dataset.active !== on) c.dataset.active = on;
      // полоса прогресса шага: каждый кадр, только transform — без ступенек и пересчёта стилей
      // (Сергей 22.10.2026: «прерывисто, как будто с зависанием… надо плавнее»)
      if (i === phase) {
        const bar = c.firstElementChild as HTMLElement | null;
        if (bar) bar.style.transform = `scaleX(${progress.toFixed(4)})`;
      }
    }
  }, []);

  return (
    <section id="week" className="section-animate py-16 md:py-24">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground">
            <Words>Одна сделка от начала до конца</Words>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '60ch' }}>
            Программа нашла сделку и проверила её. Я сказал «беру». Вы отметили место входа и нажали кнопку. Дальше робот
            вошёл, перевёл сделку в ноль и довёл до тейка.
          </p>
        </div>

        {/* живое окно терминала: неделя подписчика проигрывается по кругу */}
        <div className="mt-10 md:mt-12 max-w-5xl">
          {/* 23.10.2026, Сергей: «Ставь кольцо и монитор, монитор сделай изогнутым» — окно на изогнутом мониторе в 3D;
              без WebGL CurvedMonitor показывает прежнее окно TerminalDemo */}
          <CurvedMonitor onPhase={onPhase} />
        </div>

        {/* неделя в трёх шагах */}
        <div ref={stepsRef} className="mt-3 grid md:grid-cols-3 gap-3 max-w-5xl">
          {WEEK.map((w, i) => (
            <div key={w.title} className="td-step border border-border rounded-md bg-card p-5 md:p-6">
              <span className="td-step-bar" aria-hidden="true" />
              <div className="ns-step-n">
                {i + 1}. {w.when}
              </div>
              <div className="text-2xl mt-3 text-foreground font-semibold" style={{ letterSpacing: '-0.02em' }}>{w.title}</div>
              <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TransformationSection;
