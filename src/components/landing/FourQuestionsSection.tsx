/**
 * FourQuestionsSection — «09 · Четыре вопроса».
 *
 * Суть метода одним экраном: любая сделка проходит четыре вопроса, и дальше
 * либо допуск, либо отказ. Раньше это лежало строкой внутри карточки Trade
 * Master в блоке «Что входит» — самое конкретное в оффере было почти не видно.
 *
 * Названия шагов — указатель, из которого нельзя ничего собрать; содержимое
 * шагов (пороги, критерии, порядок проверок) на витрину не выносится.
 */

const questions = [
  {
    n: '01',
    title: 'Куда',
    desc: 'Направление инструмента и его контекст.',
  },
  {
    n: '02',
    title: 'Подтверждается ли',
    desc: 'Подтверждает ли следующий таймфрейм это направление.',
  },
  {
    n: '03',
    title: 'Когда входить',
    desc: 'Момент, в котором сделка становится действительной, и условие, без которого она не считается.',
  },
  {
    n: '04',
    title: 'Где выходить',
    desc: 'Целевой уровень и соотношение риска к прибыли.',
  },
];

const FourQuestionsSection = () => {
  return (
    <section id="questions" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">09 · Четыре вопроса</span>
          <h2 className="text-foreground">
            Четыре вопроса — дальше <em>допуск</em> <span className="mute">или отказ</span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Система отвечает на четыре вопроса любой сделки. Одинаково — в понедельник утром
            и после трёх убытков подряд.
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-3">
          {questions.map((q) => (
            <div key={q.n} className="border border-border rounded-xl bg-card p-6 flex gap-4">
              <div
                className="font-['Martian_Mono'] text-sm tabular-nums flex-shrink-0"
                style={{ color: 'hsl(var(--accent))' }}
              >
                {q.n}
              </div>
              <div>
                <div className="font-['Bricolage_Grotesque'] text-xl md:text-2xl text-foreground">
                  {q.title}
                </div>
                <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
                  {q.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-base md:text-lg text-foreground max-w-3xl">
          Прошла все четыре — допуск. Не прошла — отказ, и сделки нет.
          <span className="text-muted-foreground"> Решает алгоритм, а не настроение в моменте.</span>
        </p>
      </div>
    </section>
  );
};

export default FourQuestionsSection;
