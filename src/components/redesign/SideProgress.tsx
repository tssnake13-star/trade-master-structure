import { useEffect, useState } from 'react';

const sections = [
  { id: 'hero', label: '01 · Hero' },
  { id: 'why', label: '02 · Where' },
  { id: 'system', label: '03 · System' },
  { id: 'proof', label: '04 · Proof' },
  { id: 'voices', label: '05 · Voices' },
  { id: 'author', label: '06 · Author' },
  { id: 'formats', label: '07 · Formats' },
];

const SideProgress = () => {
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
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-30% 0px -40% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Прогресс по секциям"
      className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-3"
      style={{ display: typeof window !== 'undefined' && window.innerWidth < 1100 ? 'none' : undefined }}
    >
      {sections.map((s) => {
        const isActive = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.22em]"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: isActive ? 'hsl(var(--warm))' : 'hsl(var(--muted-foreground) / 0.45)',
              transition: 'color 0.4s ease',
            }}
          >
            <span
              className="block h-px"
              style={{
                width: isActive ? 32 : 18,
                background: isActive ? 'hsl(var(--warm))' : 'hsl(var(--rule-soft))',
                transition: 'width 0.4s ease, background 0.4s ease',
              }}
            />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {s.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
};

export default SideProgress;