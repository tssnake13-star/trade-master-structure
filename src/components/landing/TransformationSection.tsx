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
import TerminalDemo from './TerminalDemo';

const WEEK = [
  {
    when: 'Терминал · каждый день',
    title: 'Находит сделку',
    text: 'Считает рынок по правилам алгоритма и даёт допуск или отказ. Мой вердикт с причиной приходит сразу: в терминал и в Telegram.',
  },
  {
    when: 'От вас · 2 действия',
    title: 'Точка входа и СТАРТ',
    text: 'Отмечаете точку входа и нажимаете СТАРТ в советнике. Где ставить точку входа, объясняет один урок.',
  },
  {
    when: 'Сделка · живёт днями',
    title: 'Исполнение',
    text: 'Советник входит, ставит стоп и тейк, переводит в безубыток. Лимиты держит Risk Sentinel, следить за каждым движением не нужно.',
  },
];

const stops = [
  'Открываете сделку, когда показалось, что пора',
  'Ищете подтверждение уже после входа',
  'Сидите у графика в ожидании входа',
  'Берёте сделку, которой не было в вашем плане',
];

const gains = [
  'Каждая сделка имеет причину',
  'Каждый отказ тоже имеет причину',
];

const ACCENT = 'hsl(var(--accent))';

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
      if (i === phase) c.style.setProperty('--p', progress.toFixed(3));
    }
  }, []);

  return (
    <section id="week" className="section-animate py-16 md:py-24">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">03 · Неделя по системе</span>
          <h2 className="text-foreground">
            Сделка живёт днями. <em>Следить за каждым движением не нужно.</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Свинг на трёх таймфреймах, W1, D1 и H4: сделка живёт днями, и сидеть у графика ради неё не нужно.
            Так устроена неделя на подписке ECHO-GATE INSIDE. Первые 7 дней терминал можно смотреть
            бесплатно: сначала 4 коротких вопроса в Telegram-боте.
          </p>
        </div>

        {/* живое окно терминала: неделя подписчика проигрывается по кругу */}
        <div className="mt-10 md:mt-12 max-w-5xl">
          <TerminalDemo onPhase={onPhase} />
        </div>

        {/* неделя в трёх шагах */}
        <div ref={stepsRef} className="mt-3 grid md:grid-cols-3 gap-3 max-w-5xl">
          {WEEK.map((w, i) => (
            <div key={w.title} className="td-step border border-border rounded-xl bg-card p-5 md:p-6">
              <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                0{i + 1} · {w.when}
              </div>
              <div className="font-['Bricolage_Grotesque'] text-2xl mt-3 text-foreground">{w.title}</div>
              <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>

        {/* 11.10.2026: блок «10 · Защита капитала» снят с главной, его мысль и лимиты живут здесь строкой */}
        <div
          className="mt-3 max-w-5xl rounded-xl p-5 md:p-6"
          style={{ border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)' }}
        >
          <p className="text-base md:text-lg text-foreground font-medium">
            Плохую неделю останавливает лимит, а не сила воли.
          </p>
          <p className="mt-1.5 text-sm md:text-base text-muted-foreground leading-relaxed">
            Risk Sentinel следит за риском по всем позициям и сам блокирует новые сделки при −4% за неделю
            или −8% за месяц.
          </p>
        </div>

        {/* контраст: что уходит → что остаётся */}
        <div className="mt-12 md:mt-16 grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl">
          <div>
            <div className="section-label">Больше не</div>
            <ul className="space-y-4">
              {stops.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <span aria-hidden className="mt-1 flex-shrink-0 text-sm" style={{ color: 'hsl(var(--destructive))' }}>✕</span>
                  <span className="text-base md:text-lg text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:self-center md:border-l md:border-border md:pl-12">
            <div className="section-label" style={{ color: ACCENT, opacity: 1 }}>Теперь</div>
            <ul className="space-y-5">
              {gains.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <span aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}>✓</span>
                  <span className="text-xl md:text-2xl leading-snug text-foreground">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* центральный тезис проекта одной фразой */}
        <div
          className="mt-16 md:mt-24 max-w-4xl mx-auto text-center"
          style={{
            borderTop: '1px solid hsl(var(--border))',
            borderBottom: '1px solid hsl(var(--border))',
            paddingTop: '2.5rem',
            paddingBottom: '2.5rem',
          }}
        >
          <span className="section-label" style={{ display: 'inline-block' }}>
            Два пути, один алгоритм
          </span>
          {/* 11.10.2026: первым идёт подписка, школа вторым путём для тех, кто захочет глубже */}
          <p className="font-['Bricolage_Grotesque'] text-3xl md:text-5xl leading-[1.12] tracking-tight text-foreground">
            ECHO-GATE INSIDE <em className="not-italic" style={{ color: ACCENT }}>считает</em> рынок за вас:
            от вас 2 действия.
            <br className="hidden md:block" />{' '}
            Захотите решать сами, школа этому <em className="not-italic" style={{ color: ACCENT }}>научит</em>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TransformationSection;
