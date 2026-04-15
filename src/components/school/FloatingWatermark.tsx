import { useEffect, useRef, useState } from 'react';

interface Props {
  email: string;
  fullName: string | null;
}

export default function FloatingWatermark({ email, fullName }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ dx: 0.4, dy: 0.3 });
  const rafRef = useRef<number>(0);
  const [pos, setPos] = useState({ x: 100, y: 100 });

  useEffect(() => {
    // Random initial direction
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.2;
    velRef.current = { dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed };
    posRef.current = { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 };

    const animate = () => {
      const el = ref.current;
      if (!el) { rafRef.current = requestAnimationFrame(animate); return; }

      const parent = el.parentElement;
      if (!parent) { rafRef.current = requestAnimationFrame(animate); return; }

      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      const ew = el.offsetWidth;
      const eh = el.offsetHeight;

      let { x, y } = posRef.current;
      let { dx, dy } = velRef.current;

      x += dx;
      y += dy;

      if (x <= 0 || x + ew >= pw) { dx = -dx; x = Math.max(0, Math.min(x, pw - ew)); }
      if (y <= 0 || y + eh >= ph) { dy = -dy; y = Math.max(0, Math.min(y, ph - eh)); }

      posRef.current = { x, y };
      velRef.current = { dx, dy };
      setPos({ x, y });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const text = fullName ? `${fullName} · ${email}` : email;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        opacity: 0.35,
        color: '#fff',
        fontSize: '14px',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 15,
        userSelect: 'none',
        letterSpacing: '0.5px',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      }}
    >
      {text}
    </div>
  );
}
