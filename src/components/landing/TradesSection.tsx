import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import xagUsdImg from '@/assets/trades/xag-usd-08-01.jpg';
import xauUsdImg from '@/assets/trades/xau-usd-08-01.jpg';
import usdCadImg from '@/assets/trades/usd-cad-10-12-v2.jpg';
import gbpJpyImg from '@/assets/trades/gbp-jpy-16-12-v3.jpg';
import audUsdImg from '@/assets/trades/aud-usd-18-12.jpg';
import btcUsdtImg from '@/assets/trades/btc-usdt-28-01.jpg';

/**
 * Скрины из личного дневника сделок. Подписи намеренно короткие: инструмент,
 * дата, направление. Раньше под каждой карточкой стоял абзац-шаблон («сигнал
 * получен и отфильтрован…»), одинаковый на все шесть — он читался как вода и
 * ослаблял самый сильный блок. Смысл несут подводка сверху и сам скрин.
 * `side` заполняется только там, где направление известно точно.
 */
const trades = [
  { instrument: 'XAG/USD', date: '08.01.2026', side: 'WORK-BUY', image: xagUsdImg },
  { instrument: 'XAU/USD', date: '08.01.2026', side: '', image: xauUsdImg },
  { instrument: 'USD/CAD', date: '10.12.2025', side: 'WORK-SELL', image: usdCadImg },
  { instrument: 'GBP/JPY', date: '16.12.2025', side: 'WORK-BUY', image: gbpJpyImg },
  { instrument: 'AUD/USD', date: '18.12.2025', side: 'WORK-BUY', image: audUsdImg },
  { instrument: 'BTC/USDt', date: '28.01.2026', side: 'WORK-SELL', image: btcUsdtImg },
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
            Ни одна из этих сделок не была обязательной.<br />
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
                    className="w-full h-full object-cover object-center brightness-[0.4] group-hover:brightness-[0.6] transition-all duration-300 filter blur-[2px] group-hover:blur-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground text-sm">{trade.instrument}</span>
                    <span className="text-xs text-muted-foreground">{trade.date}</span>
                  </div>
                  {trade.side && (
                    <span
                      className="text-mono inline-flex px-2 py-1"
                      style={{ fontSize: 9, letterSpacing: '0.16em', color: 'hsl(var(--accent))', border: '1px solid hsl(var(--accent) / 0.3)' }}
                    >
                      {trade.side}
                    </span>
                  )}
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
                    className="w-full h-full object-cover object-center brightness-[0.4] group-hover:brightness-[0.6] transition-all duration-300 filter blur-[2px] group-hover:blur-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground text-sm">{trade.instrument}</span>
                    <span className="text-xs text-muted-foreground">{trade.date}</span>
                  </div>
                  {trade.side && (
                    <span
                      className="text-mono inline-flex px-2 py-1"
                      style={{ fontSize: 9, letterSpacing: '0.16em', color: 'hsl(var(--accent))', border: '1px solid hsl(var(--accent) / 0.3)' }}
                    >
                      {trade.side}
                    </span>
                  )}
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
                      Оригинал из дневника сделок{selectedTrade.side ? ` · ${selectedTrade.side}` : ''}
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
