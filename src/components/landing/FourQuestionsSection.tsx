import Verdict from './Verdict';
/**
 * FourQuestionsSection — «08 · Четыре вопроса».
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
    n: '1',
    title: 'Куда',
    desc: 'Направление инструмента и его контекст.',
  },
  {
    n: '2',
    title: 'Подтверждается ли',
    desc: 'Подтверждает ли следующий таймфрейм это направление.',
  },
  {
    n: '3',
    title: 'Когда входить',
    desc: 'Момент, в котором сделка становится действительной, и условие, без которого она не считается.',
  },
  {
    n: '4',
    title: 'Где выходить',
    desc: 'Целевой уровень и соотношение риска к прибыли.',
  },
];

const FourQuestionsSection = () => {
  return (
    <section id="questions" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground">
            Сделка проходит 4 вопроса. <em>Иначе её нет.</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Система отвечает на четыре вопроса любой сделки. Одинаково — в понедельник утром
            и после трёх убытков подряд.
          </p>
        </div>

        {/* облик, шаг 3 (23.10.2026): вопросы строками журнала — по порядку, с номерами; итог — знак вердикта */}
        <ol className="journal journal--q mt-8 md:mt-10 max-w-4xl">
          {questions.map((q) => (
            <li key={q.n} className="journal__row">
              <span className="journal__num">{q.n}</span>
              <span className="journal__title">{q.title}</span>
              <span className="journal__desc">{q.desc}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-base md:text-lg text-foreground max-w-3xl">
          Прошла все четыре — <Verdict ok />. Не прошла — <Verdict ok={false} />, и сделки нет.
          <span className="text-muted-foreground"> Решает алгоритм, а не настроение в моменте.</span>
        </p>
      </div>
    </section>
  );
};

export default FourQuestionsSection;
