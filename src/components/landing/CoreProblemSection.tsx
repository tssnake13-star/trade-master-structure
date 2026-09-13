/**
 * CoreProblemSection — «01 · Проблема».
 *
 * ⚠️ Переписан 13.09.2026 под «ПОРТРЕТ КЛИЕНТА.md». Клиент ТОРГУЕТ, просто
 * не по системе: входит по ощущению, сомневается после входа, пропускает
 * свою сделку на работе. Он НЕ боится нажать кнопку и не сидит без действия —
 * это портрет другой аудитории, так его не описывать.
 *
 * Прежний третий пункт «Попытка вернуть потерянное» убран: это рана того, кто
 * тильтует, а этот клиент переносит ошибку без паники.
 *
 * Расчёт «9 стопов» — из таблицы «TLT_Statement_Tactic1» (срез 05.09.2026):
 * средний выигрыш +9,40 R против −1,00 R в убыточной.
 */

const errors = [
  { n: '01', t: 'Вход по ощущению', d: 'Сделка открыта, когда показалось, что пора, а не когда сошлись условия.' },
  { n: '02', t: 'Сомнение после входа', d: 'Вошли и сразу засомневались. Позиция закрыта раньше плана.' },
  { n: '03', t: 'Пропуск на работе', d: 'Сделку ждали неделю. Она пришла, пока вы были на совещании.' },
];

const ACCENT = 'hsl(var(--accent))';

const CoreProblemSection = () => {
  return (
    <section id="problem" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">01 · Проблема</span>
          <h2 className="text-foreground">
            Вы торгуете. <span className="mute">Просто</span> <em>не по системе.</em>
          </h2>

          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Знаний у вас достаточно: термины, книги, разборы, возможно, уже была школа.
              Сделки вы открываете.
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Но решение принимает не правило, а момент. И результат не растёт,
              хотя знаний с каждым годом больше.
            </p>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-3">
          {errors.map((e) => (
            <div key={e.n} className="border border-border rounded-xl bg-card p-5">
              <div className="font-['Martian_Mono'] text-[11px] tracking-[0.2em]" style={{ color: ACCENT }}>{e.n}</div>
              <div className="font-['Bricolage_Grotesque'] text-xl mt-2 text-foreground">{e.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{e.d}</p>
            </div>
          ))}
        </div>

        {/* цена пропуска — цифрами из журнала */}
        <div
          className="mt-6 p-5 md:p-6 max-w-3xl"
          style={{ border: '1px solid hsl(var(--accent) / 0.3)', background: 'hsl(var(--accent) / 0.05)' }}
        >
          <p className="text-base md:text-lg text-foreground font-medium">
            Пропущенная сделка стоит дороже стопа.
          </p>
          <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
            Стоп по системе — это −1 R. Прибыльная сделка — в среднем +9,40 R.
            Пропустить одну — как получить <span style={{ color: ACCENT }}>9 стопов подряд</span>.
          </p>
        </div>

        <p className="mt-6 text-base md:text-lg text-foreground font-medium max-w-3xl">
          Дело не в знаниях. Не хватает правила, которое говорит сделке «да» или «нет»
          и не требует сидеть у графика.
        </p>
      </div>
    </section>
  );
};

export default CoreProblemSection;
