import { useEffect, useState } from 'react';

/** Свой тикер у отсчёта: секунды перерисовывают только эти четыре цифры, а не весь кабинет со стеклом */
export default function Countdown({ to, units = ['дн', 'ч', 'мин', 'сек'] }: { to: Date; units?: string[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id = 0;
    const tick = () => { setNow(Date.now()); id = window.setTimeout(tick, 1000 - (Date.now() % 1000)); };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(id);
  }, []);
  let diff = Math.max(0, to.getTime() - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  const cells = [String(d), String(h).padStart(2, '0'), String(m).padStart(2, '0'), String(s).padStart(2, '0')];
  return (
    <div className="cv2-count num" role="timer" aria-label={`${d} дн ${h} ч ${m} мин`}>
      {cells.map((v, i) => (
        <div key={i}><b>{v}</b><small>{units[i]}</small></div>
      ))}
    </div>
  );
}
