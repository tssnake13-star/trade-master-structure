import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * RedesignFormats — editorial layout of FormatsSection content.
 * Source FormatsSection only contains general text (no formats array),
 * so this redesign keeps the same wording verbatim and reframes it as a
 * 2-column editorial spread: left = the message, right = mono manifest.
 * No invented content.
 */
const RedesignFormats = () => {
  return (
    <section id="formats" className="py-24 md:py-32 lg:py-40">
      <div className="container-landing">
        <div className="kicker reveal mb-8">
          <span className="num">07</span>
          <span className="dot" />
          <span>FORMATS · ФОРМАТЫ</span>
        </div>

        <h2 className="reveal max-w-[20ch] mb-6 text-foreground">
          Как можно <em>работать</em> дальше.
        </h2>

        <div
          className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 1, background: 'hsl(var(--rule-soft))' }}
        >
          {/* Left tile */}
          <div className="bg-background p-8 md:p-12 reveal">
            <div
              className="flex items-center justify-between mb-8"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                <span style={{ color: 'hsl(var(--cool))' }}>01</span> · Вход
              </span>
              <span style={{ color: 'hsl(var(--warm))' }}>после фильтра</span>
            </div>

            <p
              className="text-foreground"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 'clamp(22px, 2.4vw, 32px)',
                lineHeight: 1.25,
                fontWeight: 400,
              }}
            >
              От базовой системы<br />
              до глубокой работы<br />
              с сопровождением.
            </p>

            <p
              className="mt-6 italic"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                color: 'hsl(var(--muted-foreground))',
                fontSize: 17,
                lineHeight: 1.5,
              }}
            >
              Есть несколько форматов.
            </p>
          </div>

          {/* Right tile */}
          <div className="bg-background p-8 md:p-12 reveal" style={{ transitionDelay: '120ms' }}>
            <div
              className="flex items-center justify-between mb-8"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                <span style={{ color: 'hsl(var(--cool))' }}>02</span> · Условие
              </span>
              <span style={{ color: 'hsl(var(--warm))' }}>не для всех</span>
            </div>

            <p
              className="text-foreground"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 'clamp(22px, 2.4vw, 32px)',
                lineHeight: 1.25,
                fontWeight: 400,
              }}
            >
              Доступ открывается<br />
              <em>только после</em> фильтрации.
            </p>

            <ul
              className="mt-8 space-y-0"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {[
                'Заявка через Telegram',
                'Короткое интервью',
                'Решение о допуске',
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 py-3"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid hsl(var(--rule-soft))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  <span
                    aria-hidden
                    className="block"
                    style={{
                      width: 18,
                      height: 1,
                      background: 'hsl(var(--warm))',
                    }}
                  />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA — text link, not a button */}
        <div className="mt-12 reveal">
          <a
            href={TELEGRAM_LINKS.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 group"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 22,
              color: 'hsl(var(--foreground))',
              borderBottom: '1px solid hsl(var(--warm))',
              paddingBottom: 4,
            }}
          >
            Пройти фильтрацию
            <span
              className="group-hover:translate-x-1 transition-transform"
              style={{
                fontStyle: 'italic',
                color: 'hsl(var(--warm))',
              }}
            >
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default RedesignFormats;