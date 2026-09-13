import { Check, X } from 'lucide-react';

/**
 * FitSection — «02 · Для кого». Стоит сразу за «Проблемой»: по аналитике
 * 14.08–13.09 до прежней позиции фильтра (шестой блок) доходил каждый пятый.
 *
 * ⚠️ Пункты взяты из «ПОРТРЕТ КЛИЕНТА.md», из реальных покупок и реальных
 * отказов, а не из общих слов. «Не подойдёт» — это профили, на которых уже
 * сорвались разговоры: интрадей и скальпинг, коллекционер инструментов,
 * поиск метода «который наконец сработает», последние или заёмные деньги,
 * только спот и крипта.
 *
 * Расчёт «9 стопов» — таблица «TLT_Statement_Tactic1», срез 05.09.2026.
 */

const fitItems = [
  'У вас есть основная работа или бизнес, и сидеть у графика вы не можете',
  'Вы уже торгуете и знаете, о чём речь',
  'Серия стопов вас не ломает: одна прибыльная сделка в среднем перекрывает 9 стопов',
  '50 тренировок до реального рынка вас успокаивают, а не пугают',
  'Спокойная, даже скучная торговля для вас признак порядка',
];

const notFitItems = [
  'Торгуете внутри дня или скальпите: свинг покажется скучным и чужим',
  'Ищете новый инструмент вроде стакана, кластеров, дельты. Здесь правило, а не индикатор',
  'Ищете метод, «который наконец сработает»',
  'На торговлю идут последние или заёмные деньги',
  'Торгуете только спот и крипту: система работает в MetaTrader 4 и 5',
];

const FitSection = () => {
  return (
    <section id="filter" className="section-animate py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <span className="section-label">02 · Для кого</span>
          <h2 className="text-foreground">
            Кому это <em>подойдёт</em>, <span className="mute">а кому нет</span>
          </h2>

          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Лучше понять это сейчас, чем после оплаты.
          </p>

          <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="p-4 md:p-5 bg-accent/20 border border-border rounded-xl">
              <h3 className="text-base font-medium text-foreground mb-4">
                Подойдёт, если:
              </h3>
              <ul className="space-y-3">
                {fitItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm md:text-base text-muted-foreground">
                    <Check className="w-4 h-4 text-foreground mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 md:p-5 bg-secondary/30 border border-border rounded-xl">
              <h3 className="text-base font-medium text-foreground mb-4">
                Не подойдёт, если:
              </h3>
              <ul className="space-y-3">
                {notFitItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm md:text-base text-muted-foreground">
                    <X className="w-4 h-4 text-muted-foreground/50 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FitSection;
