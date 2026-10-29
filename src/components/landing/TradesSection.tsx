import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import gbpJpyImg from '@/assets/trades/gbp-jpy-14-07-2026.jpg';
import eurJpyImg from '@/assets/trades/eur-jpy-20-07-2026.jpg';
import usdJpyImg from '@/assets/trades/usd-jpy-20-07-2026.jpg';
import eurUsdImg from '@/assets/trades/eur-usd-11-08-2026.jpg';
import gbpUsdImg from '@/assets/trades/gbp-usd-13-08-2026.jpg';
import usdCadImg from '@/assets/trades/usd-cad-19-08-2026.jpg';
import eurAudImg from '@/assets/trades/eur-aud-31-08-2026.jpg';
import gbpAudImg from '@/assets/trades/gbp-aud-31-08-2026.jpg';
import cadJpyImg from '@/assets/trades/cad-jpy-18-09-2026.jpg';
import nzdUsdImg from '@/assets/trades/nzd-usd-22-09-2026.jpg';
import usdChfImg from '@/assets/trades/usd-chf-22-09-2026.jpg';
import Words from '@/components/fx/Words';
import Verdict from './Verdict';

/**
 * Скрины из личного дневника сделок за июль — сентябрь 2026 (обновлены 06.09.2026;
 * 22.10.2026 добавлены CAD/JPY, NZD/USD и USD/CHF за сентябрь). С 23.10.2026 (облик, шаг 3) сделки — строки
 * журнала: миниатюра, дата, пара и направление, знак «Допуск», результат в R; график открывается по нажатию.
 * Подписи намеренно короткие: инструмент, дата, направление, результат в R.
 * Раньше под каждой карточкой стоял абзац-шаблон («сигнал получен
 * и отфильтрован…»), одинаковый на все — он читался как вода.
 *
 * Результат даём в R, а не в пипсах: пипсы между инструментами несопоставимы
 * (у йеновых пар и у фунта разный масштаб) и выглядят как накрутка, тогда как
 * R стыкуется с соотношением риск-прибыль в счётчике.
 *
 * ⚠️ Оговорка внизу блока обязательна: это витрина сильных сделок, а не
 * средний результат. Win Rate там стоит только вместе с +9,50 R против
 * −1,00 R — одно без другого читается как «система почти всегда ошибается».
 */
const trades = [
  { instrument: 'GBP/JPY', date: '14.07.2026', side: 'WORK-BUY', result: '+14R', image: gbpJpyImg },
  { instrument: 'EUR/JPY', date: '20.07.2026', side: 'WORK-BUY', result: '+12R', image: eurJpyImg },
  { instrument: 'USD/JPY', date: '20.07.2026', side: 'WORK-BUY', result: '+12R', image: usdJpyImg },
  { instrument: 'EUR/USD', date: '11.08.2026', side: 'WORK-BUY', result: '+11R', image: eurUsdImg },
  { instrument: 'GBP/USD', date: '13.08.2026', side: 'WORK-BUY', result: '+13,7R', image: gbpUsdImg },
  { instrument: 'USD/CAD', date: '19.08.2026', side: 'WORK-SELL', result: '+14,8R', image: usdCadImg },
  { instrument: 'GBP/AUD', date: '31.08.2026', side: 'WORK-SELL', result: '+10,9R', image: gbpAudImg },
  { instrument: 'EUR/AUD', date: '31.08.2026', side: 'WORK-SELL', result: '+8,4R', image: eurAudImg },
  { instrument: 'CAD/JPY', date: '18.09.2026', side: 'WORK-SELL', result: '+10,7R', image: cadJpyImg },
  { instrument: 'NZD/USD', date: '22.09.2026', side: 'WORK-SELL', result: '+10,8R', image: nzdUsdImg },
  { instrument: 'USD/CHF', date: '22.09.2026', side: 'WORK-BUY', result: '+15,4R', image: usdChfImg },
];

// Подпись скрина — полная, а не одно имя пары: по ней ИИ и поисковики понимают, что на
// картинке (04.10.2026, задача «чтобы любой ИИ мог читать текст и визуал»).
const tradeAlt = (t: typeof trades[0]) =>
  `${t.instrument}, ${t.date}, ${t.side === 'WORK-SELL' ? 'продажа' : 'покупка'}, результат ${t.result} — скрин сделки из дневника автора`;

const TradesSection = () => {
  const [selectedTrade, setSelectedTrade] = useState<typeof trades[0] | null>(null);

  return (
    <section id="trades" className="py-12 md:py-20 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="text-foreground">
            {/* 29.10.2026: «Каждая из этих сделок сначала получила допуск» на телефоне шёл в три строки */}
            <Words>Сначала допуск, потом сделка</Words>
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Июль — сентябрь 2026. Ни одна из этих сделок не была обязательной.<br />
            Все они были разрешены системой.
          </p>

          {/* 11.10.2026, Сергей: сделки не убирать («это двигатель»), а пометить, что решение было
              до движения. На каждом скрине два графика, «до движения» и «после»; с августа решение
              по каждой сделке записывается в журнал терминала до движения (его слова: «во всяком
              случае с августа»). Июль в журнал не попадает, поэтому «с августа», а не «все». */}
          <p
            className="mt-4 text-sm md:text-base text-muted-foreground"
            style={{ borderLeft: '2px solid var(--v3-faint)', paddingLeft: 12, maxWidth: '62ch' }}
          >
            На каждом скрине два графика: до движения и после. С августа решение по каждой сделке ещё и
            записывается в журнал терминала до движения, у каждой записи стоит время сигнала. Журнал можно{' '}
            <a
              href={TELEGRAM_LINKS.trial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('trades_trial')}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              смотреть 7 дней бесплатно
            </a>
            .
          </p>

          {/* сделки строками журнала, у каждой знак «Допуск»; график — по нажатию на строку */}
          <ul className="journal journal--trades mt-8 md:mt-10">
            {trades.map((trade, index) => (
              <li key={index}>
                <button type="button" className="journal__row" onClick={() => setSelectedTrade(trade)}>
                  {/* 23.10.2026: график в своей рамке — линия скана идёт по нему, как раньше на карточках
                      (Сергей: «шторка идёт одна по всем строкам вниз… смотрится ужасно») */}
                  <span className="journal__thumb">
                    <img src={trade.image} alt={tradeAlt(trade)} loading="lazy" decoding="async" />
                  </span>
                  <span className="journal__date">{trade.date}</span>
                  <span className="journal__sym">
                    {trade.instrument}
                    <span className="journal__dir">{trade.side === 'WORK-SELL' ? 'продажа' : 'покупка'}</span>
                  </span>
                  <span className="journal__verdict"><Verdict ok /></span>
                  <span className="journal__res">{trade.result.replace('R', ' R')}</span>
                  <span className="journal__open">Открыть график</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-muted-foreground text-center md:text-left">
            Это не поиск идеального входа.<br />
            Это результат дисциплины и работы по алгоритму.
          </p>
          {/* честная оговорка: витрина сильных сделок ≠ средний результат */}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70 text-center md:text-left" style={{ maxWidth: '62ch' }}>
            Это удачные сделки месяца, а не средний результат. По системе побед 23,5%, и средняя
            прибыльная сделка +9,50 R против −1,00 R в убыточной — прибыль приносит не частота побед,
            а размер движения, когда допуск сработал. Прошлый результат не гарантирует будущий.
          </p>

          <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
            <DialogContent className="max-w-4xl p-0 bg-card border-border overflow-hidden">
              <DialogTitle className="sr-only">
                {selectedTrade?.instrument ? `Сделка: ${selectedTrade.instrument}` : 'Сделка'}
              </DialogTitle>
              {selectedTrade && (
                <div className="relative">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <span className="font-medium text-foreground">{selectedTrade.instrument}</span>
                    <span className="text-sm text-muted-foreground">{selectedTrade.date}</span>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    <img 
                      src={selectedTrade.image} 
                      alt={`Сделка ${selectedTrade.instrument}`}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="p-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Оригинал из дневника сделок: {selectedTrade.side},{' '}
                      <span className="text-foreground">{selectedTrade.result}</span>
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default TradesSection;
