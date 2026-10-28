import { SERIES_PLAYLIST } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import Words from '@/components/fx/Words';

/*
 * Разделы страницы «Об авторе» (28.10.2026, прототип «Ночной кабинет»). Биография — только проверенное
 * (CLAUDE.md, «Биография»): 3 года терял, 2 около нуля, потом Герчик, своя система, Trade Master около трёх лет.
 * Признание датируется и закрывается тем, что работает сегодня.
 */

/** Фото в первом экране: то же, что в блоке «Автор» прежней главной (Сергей 28.10.2026: «Ты не ту фотографию взял»). */
export function AuthorPhoto() {
  return (
    <div className="ns-reveal overflow-hidden rounded-md mx-auto w-full max-w-[520px]" style={{ border: '1px solid var(--v3-line)' }}>
      <img src="/author-sergey-te.jpg" alt="Сергей Тё" width={800} height={800} className="w-full h-auto block" />
    </div>
  );
}

const PATH = [
  { when: 'первые 3 года', text: 'Только терял.' },
  { when: 'ещё 2 года', text: 'Был около нуля. Всё это время я искал идеальную точку входа и пришёл к тому, что её не существует.' },
  { when: 'потом', text: 'Пришёл учиться к опытному трейдеру и начал делать то, что он говорит. На уровнях пошли первые заработки.' },
  { when: 'своя система', text: 'Мне стало мало, и я начал строить своё. Искал не стратегию, а системность под свой характер. Trade Master складывался около трёх лет.' },
  { when: 'сегодня', text: 'Торгую свинг по той же системе, что работает в программе ECHO-GATE INSIDE: разбор рынка на выходных, в будни короткая проверка. 387 сделок за 21 месяц, и каждое решение записано в дневник до движения цены.' },
];

export function PathSection() {
  return (
    <section id="path" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <h2 className="text-foreground"><Words>Путь до своей системы</Words></h2>
        {/* строки проявляются по очереди при прокрутке (роль card), точка на линии загорается за строкой.
            У списка роль list: стилей у неё нет, она только не даёт проявлять список целиком поверх строк */}
        <ol className="ns-path mt-10 max-w-3xl" data-fx="list">
          {PATH.map((p, i) => (
            <li key={p.when} data-fx="card">
              <span className="ns-dot" aria-hidden="true" />
              <div className="ns-step-n">{p.when}</div>
              <p
                className={`mt-2 leading-relaxed ${i === PATH.length - 1 ? 'text-lg md:text-xl text-foreground' : 'text-base md:text-lg text-muted-foreground'}`}
                style={{ maxWidth: '60ch' }}
              >
                {p.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SeriesSection() {
  return (
    <section id="series" className="section-animate py-14 md:py-20 ns-band">
      <div className="container-landing">
        <div className="ns-glass p-7 md:p-10 max-w-4xl">
          <h2 className="text-foreground"><Words>Допуск или отказ</Words></h2>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/90" style={{ maxWidth: '58ch' }}>
            Каждую неделю выходит видео с разбором моих решений за неделю: какие сделки я взял, от каких отказался
            и почему.
          </p>
          <a
            href={SERIES_PLAYLIST}
            target="_blank"
            rel="noopener noreferrer"
            data-orbit=""
            onClick={() => trackClick('author_series')}
            className="btn-secondary mt-8 px-6 py-3.5 text-[15px]"
          >
            Смотреть сериал на YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
