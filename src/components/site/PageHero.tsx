import type { ReactNode } from 'react';

/**
 * Первый экран внутренних страниц (28.10.2026). Раздел с h1 хореография разделов не трогает,
 * поэтому у него своя анимация: текст проявляется снизу по очереди (.ns-rise), снимок открывается
 * шторкой (.ns-reveal в aside).
 */
export default function PageHero({
  id = 'top',
  title,
  lede,
  actions,
  note,
  aside,
  longTitle = false,
  asideBelow = false,
}: {
  id?: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  note?: ReactNode;
  aside?: ReactNode;
  /** заголовок-предложение, а не короткая фраза: мельче на компьютере, чтобы кнопки остались на первом экране */
  longTitle?: boolean;
  /** снимок под текстом и шире колонки текста: в половине экрана на компьютере мелкий текст снимка не читается */
  asideBelow?: boolean;
}) {
  return (
    <section id={id} className="relative overflow-hidden" style={{ paddingTop: 'clamp(108px, 11vw, 160px)', paddingBottom: 'clamp(56px, 7vw, 104px)' }}>
      <div className="container-landing relative">
        <div className={`grid gap-10 lg:gap-14 items-center ${aside && !asideBelow ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]' : ''}`}>
          <div className="ns-rise">
            {/* 29.10.2026: подпись над заголовком убрана (признак шаблона), её смысл стоит в первой фразе под ним */}
            <h1 className={`ns-h1 text-foreground${longTitle ? ' ns-h1--long' : ''}`}>{title}</h1>
            {lede && <p className="mt-6 text-lg md:text-xl leading-relaxed text-foreground" style={{ maxWidth: '40ch' }}>{lede}</p>}
            {actions && <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div>}
            {note && <p className="mt-6 ns-honest">{note}</p>}
          </div>
          {aside && <div className={`min-w-0${asideBelow ? ' xl:-mx-16' : ''}`}>{aside}</div>}
        </div>
      </div>
    </section>
  );
}
