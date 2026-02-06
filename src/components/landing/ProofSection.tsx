import { useState } from 'react';
import { User } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import lesiaImg from '@/assets/testimonials/lesia.jpg';
import nikolayImg from '@/assets/testimonials/nikolay.jpg';
import elenaImg from '@/assets/testimonials/elena-new.jpg';
import pavelImg from '@/assets/testimonials/pavel.jpg';

const cases = [
  {
    name: 'Lesia',
    before: 'Курсы и практика без результата.',
    after: 'Полгода торговли в плюсе.',
    key: 'Сделки по системе.',
    image: lesiaImg,
  },
  {
    name: 'Николай',
    before: 'Разрозненные знания.',
    after: 'Структура и понимание рынка.',
    key: 'Направление и риск.',
    image: nikolayImg,
  },
  {
    name: 'Елена',
    before: 'Растерянность в сделках.',
    after: 'Алгоритм и спокойствие.',
    key: 'Есть опора.',
    image: elenaImg,
  },
  {
    name: 'Pavel',
    before: 'Интуиция и новости.',
    after: 'Сценарий и подтверждение.',
    key: 'Работа по правилам.',
    image: pavelImg,
  },
];

const ProofSection = () => {
  const [selectedCase, setSelectedCase] = useState<typeof cases[0] | null>(null);

  return (
    <section id="proof" className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Трансформации учеников
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Не быстрые успехи. А дисциплина и работа по правилам.
          </p>
          
          <div className="mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {cases.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedCase(item)}
                className="p-4 bg-card border border-border rounded-xl text-left transition-all hover:border-muted-foreground/50 cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Было: {item.before}</p>
                <p className="text-xs text-foreground">Стало: {item.after}</p>
                <p className="text-xs text-primary/80 font-medium">Ключ: {item.key}</p>
                <span className="text-xs text-muted-foreground/60 mt-2 block group-hover:text-muted-foreground">
                  Открыть →
                </span>
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
