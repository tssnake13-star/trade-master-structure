import { useEffect, useState } from 'react';

const sections = [
  { id: 'hero', num: '00', label: 'Главная' },
  { id: 'problem', num: '01', label: 'Проблема' },
  { id: 'verdict', num: '★', label: 'Разбор сделок' },
  { id: 'transformation', num: '02', label: 'Трансформация' },
  { id: 'proof', num: '03', label: 'Отзывы' },
  { id: 'stats', num: '04', label: 'Результаты' },
  { id: 'trades', num: '05', label: 'Сделки' },
  { id: 'filter', num: '06', label: 'Фильтр' },
  { id: 'difference', num: '07', label: 'Отличие' },
  { id: 'included', num: '08', label: 'Что входит' },
  { id: 'trading-system', num: '09', label: 'Архитектура' },
  { id: 'protection', num: '10', label: 'Защита' },
  { id: 'stages', num: '11', label: 'Путь' },
  { id: 'formats', num: '13', label: 'Сотрудничество' },
  { id: 'author', num: '14', label: 'Автор' },
  { id: 'faq', num: '15', label: 'Вопросы' },
];

const SideNav = () => {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;

    let raf = 0;
    const update = () => {
      raf = 0;
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
      className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-2.5"
      style={{ fontFamily: "'Martian Mono', ui-monospace, monospace" }}
    >
      {sections.map((s) => {
        const isActive = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] py-1"
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
            <span className="tabular-nums opacity-70">{s.num}</span>
            <span className="opacity-40">·</span>
            <span>{s.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

export default SideNav;
