import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import xagUsdImg from '@/assets/trades/xag-usd-01-06-2026.jpg';
import gbpUsdImg from '@/assets/trades/gbp-usd-10-06-2026.jpg';
import usdCadImg from '@/assets/trades/usd-cad-10-06-2026.jpg';
import usdChfImg from '@/assets/trades/usd-chf-15-06-2026.jpg';
import xauUsdImg from '@/assets/trades/xau-usd-16-06-2026.jpg';
import btcUsdImg from '@/assets/trades/btc-usd-21-06-2026.jpg';

/**
 * Скрины из личного дневника сделок за июнь 2026. Подписи намеренно короткие:
 * инструмент, дата, направление, результат в R. Раньше под каждой карточкой
 * стоял абзац-шаблон («сигнал получен и отфильтрован…»), одинаковый на все
 * шесть — он читался как вода. Результат даём в R, а не в пипсах: пипсы между
 * инструментами несопоставимы (у биткоина шестизначные, у фунта четырёхзначные)
 * и выглядят как накрутка, тогда как R стыкуется с «R:R 10:1» в счётчике.
 */
const trades = [
  { instrument: 'XAG/USD', date: '01.06.2026', side: 'WORK-SELL', result: '+20R', image: xagUsdImg },
  { instrument: 'GBP/USD', date: '10.06.2026', side: 'WORK-SELL', result: '+18R', image: gbpUsdImg },
  { instrument: 'USD/CAD', date: '10.06.2026', side: 'WORK-BUY', result: '+24R', image: usdCadImg },
  { instrument: 'USD/CHF', date: '15.06.2026', side: 'WORK-BUY', result: '+20R', image: usdChfImg },
  { instrument: 'XAU/USD', date: '16.06.2026', side: 'WORK-SELL', result: '+16R', image: xauUsdImg },
  { instrument: 'BTC/USD', date: '21.06.2026', side: 'WORK-SELL', result: '+22R', image: btcUsdImg },
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
            Июнь 2026. Ни одна из этих сделок не была обязательной.<br />
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
            Это удачные сделки месяца, а не средний результат. По системе Win Rate 23% при среднем
            соотношении 10:1 — прибыль приносит не частота побед, а размер движения, когда допуск сработал.
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
