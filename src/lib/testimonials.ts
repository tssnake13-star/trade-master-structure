// Отзывы учеников — дословные выдержки, по нажатию оригинал из Telegram (отбор и порядок — ProofSection, 13.09.2026).
// 20.10.2026: один список на сайт («04 · Отзывы», ProofSection) и вкладку «Цены» терминала школьного бота (TgTerminal).
import rustamImg from '@/assets/testimonials/rustam.jpg';
import lesyaImg from '@/assets/testimonials/lesya.jpg';
import elenaImg from '@/assets/testimonials/elena.jpg';
import lesiaImg from '@/assets/testimonials/lesia.jpg';
import nikolayImg from '@/assets/testimonials/nikolay.jpg';
import elenaNewImg from '@/assets/testimonials/elena-new.jpg';
import pavelImg from '@/assets/testimonials/pavel.jpg';

export interface StudentCase {
  name: string;
  before: string;
  quote: string;
  image: string;
}

export const STUDENT_CASES: StudentCase[] = [
  {
    name: 'Елена М.',
    before: 'Несколько других школ. Растерянность при открытии сделок.',
    quote: 'Вы уверены в своих сделках. Если нет, Сергей рядом и направит. Вы спокойны, т.к. есть опора.',
    image: elenaNewImg,
  },
  {
    name: 'Николай',
    before: 'Прошёл две школы у двух разных преподавателей.',
    quote: 'Они дали мне базовые разрозненные знания, а школа Сергея Тё объединила и структурировала эти знания в целостную теорию.',
    image: nikolayImg,
  },
  {
    name: 'Pavel',
    before: 'Совершал новостные и интуитивные сделки, совершенно не понимая, куда идёт цена.',
    quote: 'Всё обучение разложено по полочкам, довольно понятно и просто, всё как я люблю.',
    image: pavelImg,
  },
  {
    name: 'Рустам',
    before: 'Проходил обучение пару лет назад.',
    quote: 'Хоть и знаешь, как надо, но делать как надо — это разные вещи.',
    image: rustamImg,
  },
  {
    name: 'Елена',
    before: 'Торгует основные пары и металлы.',
    quote: 'Вход в сделку очень прост, без суеты и внутреннего беспокойства, просто как сделать какую-то обыденную вещь.',
    image: elenaImg,
  },
  {
    name: 'Lesia',
    before: 'Путь длинный: курсы, годовые программы, практика, много-много практики.',
    quote: 'Крайние 6 месяцев закрылись в «плюс».',
    image: lesiaImg,
  },
  {
    name: 'Сергей',
    before: 'С 2017 года торговал по горизонтальным уровням.',
    quote: 'Всё, чему Вы учите, прекрасно работает!',
    image: lesyaImg,
  },
];
