import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import eurJpyImg from '@/assets/trades/eur-jpy-01-12.jpg';
import gbpJpy0511Img from '@/assets/trades/gbp-jpy-05-11.jpg';
import usdCadImg from '@/assets/trades/usd-cad-10-12.jpg';
import gbpJpy1612Img from '@/assets/trades/gbp-jpy-16-12-v2.jpg';
import gbpAud1912Img from '@/assets/trades/gbp-aud-19-12.jpg';
import gbpAud2511Img from '@/assets/trades/gbp-aud-25-11.jpg';

const trades = [
  // Ряд 1
  {
    instrument: 'EUR/JPY',
    date: '01.12.2025',
    description: 'Контекст сформирован.\nСценарий подтверждён.\nВход по алгоритму.',
    image: eurJpyImg,
  },
  {
    instrument: 'GBP/JPY',
    date: '05.11.2025',
    description: 'Фаза рынка определена.\nЕсть подтверждение.\nРешение по правилам.',
    image: gbpJpy0511Img,
  },
  {
    instrument: 'USD/CAD',
    date: '10.12.2025',
    description: 'Чёткий контекст.\nБез угадываний.\nИсполнение по системе.',
    image: usdCadImg,
  },
  // Ряд 2
  {
    instrument: 'GBP/JPY',
    date: '16.12.2025',
    description: 'Работа внутри сценария.\nКонтроль риска сохранён.\nБез эмоций.',
    image: gbpJpy1612Img,
  },
  {
    instrument: 'GBP/AUD',
    date: '19.12.2025',
    description: 'Контекст → подтверждение → вход.\nПоследовательные действия.',
    image: gbpAud1912Img,
  },
  {
    instrument: 'GBP/AUD',
    date: '25.11.2025',
    description: 'Не реакция на рынок.\nА заранее подготовленный план.',
    image: gbpAud2511Img,
  },
];

const TradesSection = () => {
  const [selectedTrade, setSelectedTrade] = useState<typeof trades[0] | null>(null);

  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Как выглядит сделка, когда есть система
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Не из импульса. Не из страха. По правилам.
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
