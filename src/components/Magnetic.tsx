import { useRef, type ReactNode, type PointerEvent } from 'react';

// Wraps a CTA so it gently "pulls" toward the cursor on hover.
// Transform-only, respects prefers-reduced-motion.
export default function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)';
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ display: 'inline-block', transition: 'transform 0.15s ease', willChange: 'transform' }}
    >
      {children}
    </span>
  );
}
