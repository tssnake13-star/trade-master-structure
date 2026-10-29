import Words from '@/components/fx/Words';
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

// 28.10.2026 (страница «Бинокль»): вопросы простыми словами, как в прототипе «Ночной кабинет»
const questions = [
  { n: '1', title: 'Куда идёт рынок', desc: 'Направление пары по-крупному и то, что происходит вокруг неё.' },
  { n: '2', title: 'Подтверждается ли', desc: 'Видно ли то же направление на графике помельче.' },
  { n: '3', title: 'Когда входить', desc: 'Момент, в котором сделка становится настоящей, и условие, без которого она не считается.' },
  { n: '4', title: 'Где выходить', desc: 'Цель и сколько вы рискуете ради неё.' },
];

const FourQuestionsSection = () => {
  return (
    <section id="questions" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <h2 className="text-foreground">
            {/* 29.10.2026, Сергей: «Сокращай» — прежний «Сделка проходит 4 вопроса. Иначе её нет.» на телефоне шёл в три строки */}
            <Words>4 вопроса к каждой сделке</Words>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Программа задаёт их любой сделке одинаково: в понедельник утром и после трёх убытков подряд. Прошла все
            четыре — сделка доходит до меня. Не прошла — сделки нет.
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
          <span className="text-muted-foreground"> Решают правила, а не настроение в моменте.</span>
        </p>
      </div>
    </section>
  );
};

export default FourQuestionsSection;
