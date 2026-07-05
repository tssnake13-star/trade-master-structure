/**
 * TransformationSection — «02 · Трансформация». Ставится сразу после «Проблемы»:
 * сначала — состояние трейдера (что меняется в поведении), только потом механика.
 * Осознанно без обещания срока — отсутствие числа работает как сигнал доверия.
 *
 * Контраст: сначала «кем вы перестаёте быть» (потери ощущаются сильнее, чем
 * приобретения), затем «что остаётся» — короткий принцип. Закрывается ЦЕНТРАЛЬНЫМ
 * тезисом бренда (Школа учит · Экосистема следит) — за одну фразу видна вся
 * архитектура проекта.
 */

const stops = [
  'Открываете сделки «на всякий случай»',
  'Ищете подтверждение уже после входа',
  'Перескакиваете между идеями',
  'Пытаетесь вернуть убыток следующей сделкой',
];

const gains = [
  'Каждая сделка имеет причину',
  'Каждый отказ — тоже причину',
];

const ACCENT = 'hsl(var(--accent))';

const TransformationSection = () => {
  return (
    <section id="transformation" className="section-animate py-16 md:py-24">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">02 · Трансформация</span>
          <h2 className="text-foreground">
            Меняется ваше <em>поведение</em>, а не рынок.
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
            Система не обещает прибыль к сроку. Она меняет то,{' '}
            <span style={{ color: ACCENT }}>как</span> вы принимаете решения — а
            результат идёт за поведением.
          </p>
        </div>

        {/* Контраст: кем вы перестаёте быть → что остаётся */}
        <div className="mt-10 md:mt-16 grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl">
          {/* Больше не */}
          <div>
            <div className="section-label">Больше не</div>
            <ul className="space-y-4">
              {stops.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 flex-shrink-0 text-sm"
                    style={{ color: 'hsl(var(--destructive))' }}
                  >
                    ✕
                  </span>
                  <span className="text-base md:text-lg text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Теперь */}
          <div className="md:self-center md:border-l md:border-border md:pl-12">
            <div className="section-label" style={{ color: ACCENT, opacity: 1 }}>Теперь</div>
            <ul className="space-y-5">
              {gains.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <span aria-hidden className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}>✓</span>
                  <span className="text-xl md:text-2xl leading-snug text-foreground">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Центральный тезис — за одну фразу видна архитектура всего проекта */}
        <div
          className="mt-16 md:mt-28 max-w-4xl mx-auto text-center"
          style={{
            borderTop: '1px solid hsl(var(--border))',
            borderBottom: '1px solid hsl(var(--border))',
            paddingTop: '2.5rem',
            paddingBottom: '2.5rem',
          }}
        >
          <span className="section-label" style={{ display: 'inline-block' }}>
            Зачем и школа, и экосистема
          </span>
          <p className="font-['Bricolage_Grotesque'] text-3xl md:text-5xl leading-[1.12] tracking-tight text-foreground">
            Школа <em className="not-italic" style={{ color: ACCENT }}>учит</em> вас принимать решения.
            <br className="hidden md:block" />{' '}
            Экосистема <em className="not-italic" style={{ color: ACCENT }}>следит</em> за тем,
            чтобы вы их не нарушали.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TransformationSection;
