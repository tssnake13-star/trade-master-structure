import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Окно, которое разворачивается из карточки (29.10.2026, образец Сергея — ролик Moxen Instrumental): панель стартует
 * ровно на месте карточки и вырастает в большое окно посреди экрана, остальное в это время тускнеет (класс dim
 * у сетки ставит родитель). Закрытие — обратно в карточку. Esc и крестик закрывают.
 */
export default function Expand({ from, onClosed, label, alert = false, children }: {
  from: HTMLElement;
  onClosed: () => void;
  label: string;
  alert?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const closing = useRef(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rectOf = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` };
  };

  useLayoutEffect(() => {
    const p = ref.current;
    if (!p) return;
    p.style.transition = 'none';
    Object.assign(p.style, rectOf(from));
    void p.offsetWidth;
    p.style.transition = '';
    const vw = window.innerWidth, vh = window.innerHeight;
    const mw = Math.min(1120, vw - 24), mh = Math.min(620, vh - 110);
    Object.assign(p.style, { top: `${Math.max(84, (vh - mh) / 2)}px`, left: `${(vw - mw) / 2}px`, width: `${mw}px`, height: `${mh}px` });
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const p = ref.current;
    setOpen(false);
    if (p && document.body.contains(from)) Object.assign(p.style, rectOf(from));
    window.setTimeout(() => { onClosed(); from.focus?.(); }, reduce ? 0 : 560);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // окно рисуется в корне кабинета, а не внутри сетки: сетку на фоне размывают (filter), и окно размылось бы с ней
  const host = (from.closest('.cv2') as HTMLElement | null) || document.body;
  return createPortal(
    <div ref={ref} className={`cv2-panel${open ? ' open' : ''}${alert ? ' alert' : ''}`} role="dialog" aria-label={label}>
      <button type="button" className="cv2-close" onClick={close} aria-label="Закрыть"><X size={16} /></button>
      <div className="cv2-panel-in">{children}</div>
    </div>,
    host,
  );
}
