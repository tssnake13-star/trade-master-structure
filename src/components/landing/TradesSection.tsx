import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import gbpJpyImg from '@/assets/trades/gbp-jpy-14-07-2026.jpg';
import eurJpyImg from '@/assets/trades/eur-jpy-20-07-2026.jpg';
import usdJpyImg from '@/assets/trades/usd-jpy-20-07-2026.jpg';
import eurUsdImg from '@/assets/trades/eur-usd-11-08-2026.jpg';
import gbpUsdImg from '@/assets/trades/gbp-usd-13-08-2026.jpg';
import usdCadImg from '@/assets/trades/usd-cad-19-08-2026.jpg';
import eurAudImg from '@/assets/trades/eur-aud-31-08-2026.jpg';
import gbpAudImg from '@/assets/trades/gbp-aud-31-08-2026.jpg';

/**
 * Скрины из личного дневника сделок за июль и август 2026 (обновлены 06.09.2026).
 * Подписи намеренно короткие: инструмент, дата, направление, результат в R.
 * Раньше под каждой карточкой стоял абзац-шаблон («сигнал получен
 * и отфильтрован…»), одинаковый на все — он читался как вода.
 *
 * Результат даём в R, а не в пипсах: пипсы между инструментами несопоставимы
 * (у йеновых пар и у фунта разный масштаб) и выглядят как накрутка, тогда как
 * R стыкуется с соотношением риск-прибыль в счётчике.
 *
 * ⚠️ Оговорка внизу блока обязательна: это витрина сильных сделок, а не
 * средний результат. Win Rate там стоит только вместе с +9,40 R против
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
];

const TradesSection = () => {
  const [selectedTrade, setSelectedTrade] = useState<typeof trades[0] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.offsetWidth * 0.9 + 12; // 90% + gap
      setActiveIndex(Math.round(scrollLeft / cardWidth));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="trades" className="py-12 md:py-20 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl">
          <span className="section-label">05 · Сделки</span>
          <h2 className="text-foreground">
            Как выглядит <em>сделка</em>, <span className="mute">когда есть система</span>
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Июль и август 2026. Ни одна из этих сделок не была обязательной.<br />
            Все они были разрешены системой.
          </p>

          {/* Mobile — horizontal scroll snap */}
          <div
            ref={scrollRef}
            className="mt-8 md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {trades.map((trade, index) => (
              <button
                key={index}
                onClick={() => setSelectedTrade(trade)}
                className="snap-center shrink-0 bg-card border border-border rounded-xl text-left transition-all hover:border-muted-foreground/50 cursor-pointer group overflow-hidden"
                style={{ width: '90%' }}
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={trade.image}
                    alt={trade.instrument}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center brightness-[0.4] group-hover:brightness-[0.6] transition-all duration-300 filter blur-[2px] group-hover:blur-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground text-sm">{trade.instrument}</span>
                    <span className="text-xs text-muted-foreground">{trade.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-mono inline-flex px-2 py-1"
                      style={{ fontSize: 9, letterSpacing: '0.16em', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
                    >
                      {trade.side}
                    </span>
                    <span
                      className="font-['Bricolage_Grotesque'] tabular-nums"
                      style={{ fontSize: 18, lineHeight: 1, color: 'hsl(var(--accent))' }}
                    >
                      {trade.result}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/60 mt-3 block group-hover:text-muted-foreground">
                    Открыть разбор ↗
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile dot indicators */}
          <div className="md:hidden flex justify-center gap-1.5 mt-2">
            {trades.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  i === activeIndex ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              />
            ))}
          </div>
          
          {/* Desktop — grid */}
          <div className="mt-8 md:mt-10 hidden md:grid md:grid-cols-3 gap-3 md:gap-4">
            {trades.map((trade, index) => (
              <button
                key={index}
                onClick={() => setSelectedTrade(trade)}
                className="bg-card border border-border rounded-xl text-left transition-all hover:border-muted-foreground/50 cursor-pointer group overflow-hidden"
              >
                <div className="relative h-24 md:h-28 overflow-hidden">
                  <img
                    src={trade.image}
                    alt={trade.instrument}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center brightness-[0.4] group-hover:brightness-[0.6] transition-all duration-300 filter blur-[2px] group-hover:blur-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground text-sm">{trade.instrument}</span>
                    <span className="text-xs text-muted-foreground">{trade.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-mono inline-flex px-2 py-1"
                      style={{ fontSize: 9, letterSpacing: '0.16em', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
                    >
                      {trade.side}
                    </span>
                    <span
                      className="font-['Bricolage_Grotesque'] tabular-nums"
                      style={{ fontSize: 18, lineHeight: 1, color: 'hsl(var(--accent))' }}
                    >
                      {trade.result}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/60 mt-3 block group-hover:text-muted-foreground">
                    Открыть разбор ↗
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground text-center md:text-left">
            Это не поиск идеального входа.<br />
            Это результат дисциплины и работы по алгоритму.
          </p>
          {/* честная оговорка: витрина сильных сделок ≠ средний результат */}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70 text-center md:text-left" style={{ maxWidth: '62ch' }}>
            Это удачные сделки месяца, а не средний результат. По системе побед 23,3%, и средняя
            прибыльная сделка +9,40 R против −1,00 R в убыточной — прибыль приносит не частота побед,
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
                      Оригинал из дневника сделок · {selectedTrade.side} ·{' '}
                      <span style={{ color: 'hsl(var(--accent))' }}>{selectedTrade.result}</span>
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
