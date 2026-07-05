/**
 * TransformationSection — «02 · Трансформация». Ставится сразу после «Проблемы»:
 * сначала — состояние трейдера (что меняется в поведении), только потом механика.
 * Осознанно без обещания срока — отсутствие числа работает как сигнал доверия.
 * Закрывается центральной мыслью бренда (Школа учит · Экосистема следит).
 */

const shifts = [
  'Входите только после подтверждения структуры — не на опережение',
  'Можете назвать причину каждой открытой сделки',
  'Сделок меньше — каждая весомее',
  'После убытка держите паузу, а не отыгрываетесь',
];

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
            <span style={{ color: 'hsl(var(--accent))' }}>как</span> вы принимаете решения — а
            результат идёт за поведением.
          </p>
        </div>

        <div className="mt-8 md:mt-12 max-w-3xl">
          {shifts.map((s) => (
            <div key={s} className="flex items-start gap-4 py-4 border-b border-border">
              <span className="mt-1 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }}>—</span>
              <span className="text-lg md:text-xl text-foreground">{s}</span>
            </div>
          ))}
        </div>

        <p className="mt-10 md:mt-16 max-w-3xl font-['Bricolage_Grotesque'] text-2xl md:text-4xl leading-tight tracking-tight text-foreground">
          Школа <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>учит</em> вас
          принимать решения. Экосистема следит за тем, чтобы вы их не нарушали.
        </p>
      </div>
    </section>
  );
};

export default TransformationSection;
