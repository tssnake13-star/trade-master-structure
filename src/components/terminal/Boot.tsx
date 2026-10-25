import type { CSSProperties } from 'react';

/**
 * Запуск терминала — вместо надписи «загружаю рынок…» (25.10.2026, его выбор «A-C-D вместе» по странице вариантов).
 * Глаз рисуется и открывается, буквы ECHO-GATE INSIDE проявляются, строки готовности загораются по настоящим
 * запросам (доступ, рынок, журнал решений и скринер), а не по таймеру. Стили — src/styles/echo-fx.css.
 */
export type BootSteps = { access: boolean; market: boolean; feeds: boolean };

const LINES: [keyof BootSteps, string][] = [
  ['access', 'доступ'],
  ['market', 'рынок'],
  ['feeds', 'журнал решений и скринер'],
];

export default function Boot({ steps }: { steps: BootSteps }) {
  const done = LINES.filter(([k]) => steps[k]).length;
  return (
    <div className="tm-boot" role="status" aria-label="Загружаю терминал">
      <div className="tm-boot-box">
        {/* тот же глаз, что в шапке (lucide Eye), с длиной пути 1 — чтобы нарисовать его линией */}
        <svg className="tm-boot-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <g>
            <path pathLength={1} d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle pathLength={1} cx="12" cy="12" r="3" />
          </g>
        </svg>
        <div className="tm-boot-title" aria-hidden="true">
          {Array.from('ECHO-GATE INSIDE').map((ch, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties}>{ch}</span>
          ))}
        </div>
        <div className="tm-boot-lines">
          {LINES.map(([k, name], i) => (
            <div key={k} style={{ '--i': i } as CSSProperties}>
              <span>{name}</span>
              <em data-ok={steps[k] ? '' : undefined}>{steps[k] ? 'готово' : '…'}</em>
            </div>
          ))}
        </div>
        <div className="tm-boot-bar">
          <i style={{ transform: `scaleX(${(0.1 + (0.9 * done) / LINES.length).toFixed(3)})` }} />
        </div>
      </div>
    </div>
  );
}
