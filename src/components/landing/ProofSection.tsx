import { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import vitaliyImg from '@/assets/testimonials/vitaliy.jpg';
import rustamImg from '@/assets/testimonials/rustam.jpg';
import lesyaImg from '@/assets/testimonials/lesya.jpg';
import elenaImg from '@/assets/testimonials/elena.jpg';
import lesiaImg from '@/assets/testimonials/lesia.jpg';
import nikolayImg from '@/assets/testimonials/nikolay.jpg';
import elenaNewImg from '@/assets/testimonials/elena-new.jpg';
import pavelImg from '@/assets/testimonials/pavel.jpg';

const cases = [
  {
    name: 'Виталий',
    before: 'Хаотичные входы, постоянные сомнения.',
    after: 'Чёткий фильтр, меньше действий, больше уверенности.',
    key: 'Структура вместо хаоса',
    image: vitaliyImg,
  },
  {
    name: 'Рустам',
    before: 'Попытки ловить каждое движение.',
    after: 'Работа только по допуску, без перегрузки.',
    key: 'Меньше действий — больше результата',
    image: rustamImg,
  },
  {
    name: 'Сергей',
    before: 'Сильный анализ, слабые решения.',
    after: 'Структура, которая фиксирует действия.',
    key: 'Решения стали системными',
    image: lesyaImg,
  },
  {
    name: 'Елена',
    before: 'Страх после входа.',
    after: 'Понимание, почему сделка открыта.',
    key: 'Ясность вместо тревоги',
    image: elenaImg,
  },
  {
    name: 'Lesia',
    before: 'Постоянные сомнения.',
    after: 'Ясность в каждом действии.',
    key: 'Уверенность через систему',
    image: lesiaImg,
  },
  {
    name: 'Николай',
    before: 'Перегруз информацией.',
    after: 'Один алгоритм вместо хаоса.',
    key: 'Знания сложились в систему',
    image: nikolayImg,
  },
  {
    name: 'Елена М.',
    before: 'Эмоциональные решения.',
    after: 'Работа через фильтр.',
    key: 'Опора вместо импульса',
    image: elenaNewImg,
  },
  {
    name: 'Pavel',
    before: 'Отсутствие системности.',
    after: 'Последовательная работа.',
    key: 'Дисциплина вместо хаоса',
    image: pavelImg,
  },
];

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="#2AABEE" className="w-4 h-4">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const ProofSection = () => {
  const [selectedCase, setSelectedCase] = useState<typeof cases[0] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.offsetWidth * 0.85 + 12; // 85% + gap
      setActiveIndex(Math.round(scrollLeft / cardWidth));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="proof" className="py-12 md:py-20 bg-card/50 section-animate">
      <div className="container-landing">
        <div className="max-w-4xl">
          <span className="section-label">006 · Доказательства</span>
          <h2 className="text-foreground">
            Что происходит, когда <em>появляется</em> <span className="mute">система</span>
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Не быстрые результаты. А изменение мышления и структуры.
          </p>

          <p className="mt-2 text-sm text-muted-foreground/70">
            Нажмите на карточку — оригинальный отзыв из Telegram
          </p>
          
          {/* Mobile — horizontal scroll snap */}
          <div
            ref={scrollRef}
            className="mt-8 md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cases.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedCase(item)}
                className="snap-center shrink-0 p-4 bg-card border border-border rounded-xl text-left transition-all duration-200 hover:border-muted-foreground/50 cursor-pointer group"
                style={{ width: '85%' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Было: {item.before}</p>
                <p className="text-xs text-foreground">Стало: {item.after}</p>
                <p className="text-xs text-primary/80 font-medium mt-1">Ключ: {item.key}</p>
                <div className="flex items-center gap-1.5 mt-3 justify-end">
                  <TelegramIcon />
                  <span className="text-xs text-[#2AABEE]/70 group-hover:text-[#2AABEE]">оригинал</span>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile dot indicators */}
          <div className="md:hidden flex justify-center gap-1.5 mt-2">
            {cases.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  i === activeIndex ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              />
            ))}
          </div>

          {/* Desktop — grid */}
          <div className="mt-8 md:mt-10 hidden md:grid md:grid-cols-4 gap-3 md:gap-4">
            {cases.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedCase(item)}
                className="p-4 bg-card border border-border rounded-xl text-left transition-all duration-200 hover:border-muted-foreground/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Было: {item.before}</p>
                <p className="text-xs text-foreground">Стало: {item.after}</p>
                <p className="text-xs text-primary/80 font-medium mt-1">Ключ: {item.key}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <TelegramIcon />
                  <span className="text-xs text-[#2AABEE]/70 group-hover:text-[#2AABEE]">оригинал</span>
                </div>
              </button>
            ))}
          </div>

          <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
            <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden">
              <DialogTitle className="sr-only">
                {selectedCase?.name ? `Отзыв: ${selectedCase.name}` : 'Отзыв'}
              </DialogTitle>
              {selectedCase && (
                <div className="relative">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{selectedCase.name}</span>
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
        </div>
      </div>
    </section>
  );
};

export default ProofSection;
