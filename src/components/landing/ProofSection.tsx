import { useState } from 'react';
import { ArrowRight, TrendingUp, User, AlertCircle, BarChart3 } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import eurAudImg from '@/assets/trades/eur-aud.jpg';
import gbpUsdImg from '@/assets/trades/gbp-usd.jpg';
import usdJpyImg from '@/assets/trades/usd-jpy.jpg';
import usdCadImg from '@/assets/trades/usd-cad.jpg';
import vitaliyImg from '@/assets/testimonials/vitaliy.jpg';
import rustamImg from '@/assets/testimonials/rustam.jpg';
import lesyaImg from '@/assets/testimonials/lesya.jpg';
import elenaImg from '@/assets/testimonials/elena.jpg';

const cases = [
  {
    name: 'Виталий',
    result: 'Хаотичные входы и постоянные сомнения → чёткие сценарии и спокойная торговля.',
    type: 'success',
    image: vitaliyImg,
  },
  {
    name: 'Рустам',
    result: 'Торговля «по ощущениям» → работа с накоплением и защита капитала. Выплата $20 248.',
    type: 'success',
    image: rustamImg,
  },
  {
    name: 'Сергей',
    result: 'Страх упустить движение → входы только по плану и заранее определённым условиям.',
    type: 'success',
    image: lesyaImg,
  },
  {
    name: 'Елена',
    result: 'Эмоции сильнее правил → дисциплина, риск-контроль и честный результат.',
    type: 'honest',
    image: elenaImg,
  },
];

const trades = [
  { 
    pair: 'EUR/AUD', 
    date: '04.09.2025', 
    result: '+17R', 
    algorithm: 'W1 → D1 → H4. Вход по системе, не по импульсу.',
    image: eurAudImg 
  },
  { 
    pair: 'GBP/USD', 
    date: '17.10.2025', 
    result: '+16R', 
    algorithm: 'W1 → D1 → H4. Вход по системе, не по импульсу.',
    image: gbpUsdImg 
  },
  { 
    pair: 'USD/JPY', 
    date: '17.10.2025', 
    result: '+16R', 
    algorithm: 'W1 → D1 → H4. Вход по системе, не по импульсу.',
    image: usdJpyImg 
  },
  { 
    pair: 'USD/CAD', 
    date: '29.10.2025', 
    result: '+19R', 
    algorithm: 'W1 → D1 → H4. Вход по системе, не по импульсу.',
    image: usdCadImg 
  },
];

const ProofSection = () => {
  const [selectedCase, setSelectedCase] = useState<typeof cases[0] | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<typeof trades[0] | null>(null);

  return (
    <section id="proof" className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Результаты, которые появляются после отказа от хаоса
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Это не быстрые успехи и не случайные сделки. Это результат системного подхода и жёсткой фильтрации входов.
          </p>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {cases.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedCase(item)}
                className="p-5 bg-card border border-border rounded-xl text-left transition-all duration-200 hover:border-muted-foreground/50 hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-background/20 active:translate-y-0 active:shadow-none cursor-pointer group flex flex-col h-full min-h-[140px]"
              >
                <div className="flex items-center gap-2 mb-3">
                  {item.type === 'honest' ? (
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed flex-1 whitespace-pre-line">{item.result}</p>
                <span className="text-xs text-muted-foreground/60 mt-3 group-hover:text-muted-foreground transition-colors">
                  Открыть отзыв →
                </span>
              </button>
            ))}
          </div>

          {/* Testimonial Modal */}
          <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
            <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden">
              <DialogTitle className="sr-only">
                {selectedCase?.name ? `Отзыв: ${selectedCase.name}` : 'Отзыв'}
              </DialogTitle>
              {selectedCase && (
                <div className="relative">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedCase.type === 'honest' ? (
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground">{selectedCase.name}</span>
                    </div>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    <img 
                      src={selectedCase.image} 
                      alt={`Отзыв ${selectedCase.name}`}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Trades Section */}
          <div className="mt-12 p-4 md:p-8 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              <h3 className="text-lg md:text-xl font-medium text-foreground">Примеры сделок по системе TRADE MASTER</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {trades.map((trade, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTrade(trade)}
                  className="p-4 md:p-5 bg-secondary/50 border border-border/50 rounded-lg text-left transition-all duration-200 hover:border-muted-foreground/50 hover:bg-secondary/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-background/20 active:translate-y-0 active:shadow-none cursor-pointer group flex flex-col h-full min-h-[140px] md:min-h-[160px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground text-xs md:text-sm">{trade.pair}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{trade.date}</span>
                  <span className="text-base md:text-lg font-bold text-foreground mt-2">{trade.result}</span>
                  <span className="text-xs text-muted-foreground mt-1 flex-1 whitespace-pre-line">{trade.algorithm}</span>
                  <span className="text-xs text-muted-foreground/60 mt-3 group-hover:text-muted-foreground transition-colors">
                    Открыть сделку →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Trade Modal */}
          <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
            <DialogContent className="max-w-4xl p-0 bg-card border-border overflow-hidden">
              <DialogTitle className="sr-only">
                {selectedTrade?.pair ? `Сделка: ${selectedTrade.pair}` : 'Сделка'}
              </DialogTitle>
              {selectedTrade && (
                <div className="relative">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <BarChart3 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <span className="font-semibold text-foreground">{selectedTrade.pair}</span>
                        <span className="text-muted-foreground mx-2">•</span>
                        <span className="text-muted-foreground text-sm">{selectedTrade.date}</span>
                      </div>
                      <span className="font-bold text-foreground">{selectedTrade.result}</span>
                    </div>
                  </div>
                  <div className="max-h-[75vh] overflow-y-auto">
                    <img 
                      src={selectedTrade.image} 
                      alt={`Сделка ${selectedTrade.pair}`}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <div className="mt-10">
            <p className="mb-3 text-sm text-muted-foreground/70">
              Здесь я разбираю рынок и сделки без сигналов и угадываний.
            </p>
            <a
              href={TELEGRAM_LINKS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group"
            >
              Перейти в Telegram-канал
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              Разборы сделок, логика входов и путь к торговому алгоритму 🧠
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProofSection;
