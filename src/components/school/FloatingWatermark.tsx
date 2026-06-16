import { useEffect, useMemo, useRef } from 'react';

interface Props {
  email: string;
  fullName: string | null;
}

/** Inline styles that must stay intact. Re-asserted periodically so that
 * removing/hiding the watermark via DevTools is undone automatically. */
const ROOT_CRITICAL: Record<string, string> = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  zIndex: '15',
  pointerEvents: 'none',
  overflow: 'hidden',
  opacity: '1',
  display: 'block',
  visibility: 'visible',
};
const TILE_OPACITY = '0.055'; // sparse + pale background grid
const MOVE_OPACITY = '0.30';  // floating accent label

function applyStyle(el: HTMLElement, styles: Record<string, string>) {
  for (const k in styles) {
    // Only write when it drifted — avoids needless mutations.
    if ((el.style as unknown as Record<string, string>)[k] !== styles[k]) {
      (el.style as unknown as Record<string, string>)[k] = styles[k];
    }
  }
}

export default function FloatingWatermark({ email, fullName }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);
  const moveRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLElement | null>(null);

  const text = fullName ? `${fullName} · ${email}` : email;
  // Sparse grid: fewer labels than before.
  const tiles = useMemo(() => Array.from({ length: 14 }), []);

  // Floating animation for the accent label
  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.2;
    let x = Math.random() * 180 + 40;
    let y = Math.random() * 180 + 40;
    let dx = Math.cos(angle) * speed;
    let dy = Math.sin(angle) * speed;
    let raf = 0;

    const step = () => {
      const el = moveRef.current;
      const parent = el?.parentElement;
      if (el && parent) {
        const pw = parent.clientWidth;
        const ph = parent.clientHeight;
        const ew = el.offsetWidth;
        const eh = el.offsetHeight;
        x += dx; y += dy;
        if (x <= 0 || x + ew >= pw) { dx = -dx; x = Math.max(0, Math.min(x, pw - ew)); }
        if (y <= 0 || y + eh >= ph) { dy = -dy; y = Math.max(0, Math.min(y, ph - eh)); }
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Self-healing watchdog: re-attach + restore styles if tampered with.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    parentRef.current = root.parentElement;

    const enforce = () => {
      const r = rootRef.current;
      const parent = parentRef.current;
      if (!r) return;
      if (parent && !parent.contains(r)) parent.appendChild(r);
      applyStyle(r, ROOT_CRITICAL);
      const tiles = tilesRef.current;
      const move = moveRef.current;
      if (tiles) {
        if (!r.contains(tiles)) r.appendChild(tiles);
        applyStyle(tiles, { opacity: TILE_OPACITY, display: 'flex', visibility: 'visible' });
      }
      if (move) {
        if (!r.contains(move)) r.appendChild(move);
        applyStyle(move, { opacity: MOVE_OPACITY, display: 'block', visibility: 'visible' });
      }
    };

    // Instant reaction to DOM/attribute changes + periodic fallback.
    const observer = new MutationObserver(enforce);
    if (root.parentElement) {
      observer.observe(root.parentElement, { childList: true });
    }
    observer.observe(root, { attributes: true, attributeFilter: ['style', 'class'], childList: true, subtree: true });
    const interval = setInterval(enforce, 700);
    enforce();

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div ref={rootRef} data-wm-guard="1" style={ROOT_CRITICAL as React.CSSProperties}>
      {/* Sparse, pale diagonal grid */}
      <div
        ref={tilesRef}
        style={{
          position: 'absolute',
          inset: '-20% -10%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '64px 96px',
          transform: 'rotate(-22deg)',
          alignContent: 'center',
          justifyContent: 'center',
          opacity: TILE_OPACITY,
          pointerEvents: 'none',
        }}
      >
        {tiles.map((_, i) => (
          <span
            key={i}
            style={{
              color: '#fff',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.5px',
              fontFamily: "'Martian Mono', monospace",
              userSelect: 'none',
            }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* Floating accent label */}
      <div
        ref={moveRef}
        style={{
          position: 'absolute',
          left: 100,
          top: 100,
          opacity: MOVE_OPACITY,
          color: '#fff',
          fontSize: '21px',
          fontFamily: "'Martian Mono', monospace",
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.5px',
          textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.6)',
        }}
      >
        {text}
      </div>
    </div>
  );
}
