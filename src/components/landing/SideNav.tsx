import { useEffect, useState } from 'react';

// In page-flow order, using each section's real section-label
const sections = [
  { id: 'experience', num: '001', label: 'Опыт' },
  { id: 'learning', num: '002', label: 'Обучение' },
  { id: 'rules', num: '003', label: 'Правила' },
  { id: 'errors', num: '004', label: 'Ошибки' },
  { id: 'what-goes-wrong', num: '005', label: 'Фаза' },
  { id: 'trading-system', num: '011', label: 'Архитектура' },
  { id: 'proof', num: '006', label: 'Доказательства' },
  { id: 'trades', num: '007', label: 'Сделки' },
  { id: 'stages', num: '014', label: 'Путь' },
  { id: 'results', num: '008', label: 'Результат' },
  { id: 'filter', num: '009', label: 'Фильтр' },
  { id: 'formats', num: '010', label: 'Сотрудничество' },
  { id: 'author', num: '012', label: 'Автор' },
];

const SideNav = () => {
  const [active, setActive] = useState<string>(sections[0].id);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: '-30% 0px -50% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Навигация по разделам"
      className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-2.5"
      style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
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
