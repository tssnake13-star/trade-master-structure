import { useEffect, useState } from 'react';

const sections = [
  { id: 'hero', label: 'Главная' },
  { id: 'problem', label: 'Проблема' },
  { id: 'filter', label: 'Для кого' },
  { id: 'week', label: 'Неделя по системе' },
  { id: 'proof', label: 'Отзывы' },
  { id: 'stats', label: 'Результаты' },
  { id: 'trades', label: 'Сделки' },
  { id: 'difference', label: 'Отличие' },
  { id: 'questions', label: 'Четыре вопроса' },
  { id: 'formats', label: 'Сотрудничество' },
  { id: 'author', label: 'Автор' },
  { id: 'faq', label: 'Вопросы' },
];

const SideNav = () => {
  const [active, setActive] = useState<string>(sections[0].id);
  // на первом экране меню не показываем: там оно перекрывает текст и строку-фильтр,
  // а листать ещё никто не начал
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      setPastHero(window.scrollY > window.innerHeight * 0.7);
      const probe = window.innerHeight * 0.35; // линия активации сверху вьюпорта
      let current = targets[0].id;
      for (const el of targets) {
        const top = el.getBoundingClientRect().top;
        if (top - probe <= 0) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav
      aria-label="Навигация по разделам"
      // с 1680px: при меньшей ширине подписи меню (правый край около 268px)
      // наезжали на левый край содержимого (07.10.2026, замер на 1600px: 268 против 249)
      className="hidden min-[1680px]:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-2.5"
      style={{
        fontFamily: "'Martian Mono', ui-monospace, monospace",
        opacity: pastHero ? 1 : 0,
        pointerEvents: pastHero ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      {sections.map((s) => {
        const isActive = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group flex items-center gap-3 text-[12.5px] tracking-[0.01em] py-1"
            style={{
              color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.5)',
              transition: 'color 0.3s ease',
            }}
          >
            <span
              aria-hidden
              className="block h-px"
              style={{
                width: isActive ? 28 : 16,
                background: isActive
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--muted-foreground) / 0.35)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
            <span>{s.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

export default SideNav;
