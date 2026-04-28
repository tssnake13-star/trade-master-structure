import { useEffect, useState } from 'react';

const sections = [
  { id: 'hero', num: '01', label: 'ОТКРЫТИЕ' },
  { id: 'what-goes-wrong', num: '02', label: 'ПРОБЛЕМА' },
  { id: 'trading-system', num: '03', label: 'СИСТЕМА' },
  { id: 'trades', num: '04', label: 'СДЕЛКИ' },
  { id: 'proof', num: '05', label: 'ГОЛОСА' },
  { id: 'author', num: '06', label: 'АВТОР' },
  { id: 'formats', num: '07', label: 'ФОРМАТЫ' },
];

const SideNav = () => {
  const [active, setActive] = useState<string>('hero');

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
      { threshold: [0.2, 0.5, 0.8], rootMargin: '-30% 0px -40% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Навигация по разделам"
      className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-3"
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
