import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import xagUsdImg from '@/assets/trades/xag-usd-08-01.jpg';
import xauUsdImg from '@/assets/trades/xau-usd-08-01.jpg';
import usdCadImg from '@/assets/trades/usd-cad-10-12-v2.jpg';
import gbpJpyImg from '@/assets/trades/gbp-jpy-16-12-v3.jpg';
import audUsdImg from '@/assets/trades/aud-usd-18-12.jpg';
import btcUsdtImg from '@/assets/trades/btc-usdt-28-01.jpg';

const trades = [
  {
    instrument: 'XAG/USD',
    date: '08.01.2026',
    description: 'Системный сигнал получен и отфильтрован вручную.\nКонтекст и подтверждение совпали по алгоритму.\nВход WORK-BUY, сопровождение через HunterBot.',
    image: xagUsdImg,
  },
  {
    instrument: 'XAU/USD',
    date: '08.01.2026',
    description: 'Сделка разрешена системой после фильтрации сигнала.\nКонтекст → подтверждение → точка входа.\nИсполнение по алгоритму, без угадываний.',
    image: xauUsdImg,
  },
  {
    instrument: 'USD/CAD',
    date: '10.12.2025',
    description: 'Чёткий сценарий после ручной фильтрации сигнала.\nКонтекст и подтверждение совпали.\nВход WORK-SELL, сопровождение по системе.',
    image: usdCadImg,
  },
  {
    instrument: 'GBP/JPY',
    date: '16.12.2025',
    description: 'Фаза рынка определена, сигнал отфильтрован.\nПодтверждение получено по алгоритму.\nВход WORK-BUY, дальше работа по плану.',
    image: gbpJpyImg,
  },
  {
    instrument: 'AUD/USD',
    date: '18.12.2025',
    description: 'Системный сигнал → ручная фильтрация.\nКонтекст и подтверждение совпали.\nВход WORK-BUY и сопровождение по правилам.',
    image: audUsdImg,
  },
  {
    instrument: 'BTC/USDt',
    date: '28.01.2026',
    description: 'Сделка разрешена системой после фильтрации.\nКонтекст → подтверждение → точка входа.\nВход WORK-SELL, точное исполнение по системе.',
    image: btcUsdtImg,
  },
];

const TradesSection = () => {
  const [selectedTrade, setSelectedTrade] = useState<typeof trades[0] | null>(null);

  return (
    <section id="trades" className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Как выглядит сделка, когда есть система
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Ни одна из этих сделок не была обязательной.<br />
            Все они были разрешены системой.
          </p>
          
          <div className="mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {trades.map((trade, index) => (
              <button
                key={index}
                onClick={() => setSelectedTrade(trade)}
                className="p-4 bg-card border border-border rounded-xl text-left transition-all hover:border-muted-foreground/50 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-foreground text-sm">{trade.instrument}</span>
                  <span className="text-xs text-muted-foreground">{trade.date}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {trade.description}
                </p>
                <span className="text-xs text-muted-foreground/60 mt-3 block group-hover:text-muted-foreground">
                  Открыть сделку →
                </span>
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
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedTrade.description}
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
