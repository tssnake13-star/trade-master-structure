import { useState } from 'react';
import { User } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import vitaliyImg from '@/assets/testimonials/vitaliy.jpg';
import rustamImg from '@/assets/testimonials/rustam.jpg';
import lesyaImg from '@/assets/testimonials/lesya.jpg';
import elenaImg from '@/assets/testimonials/elena.jpg';

const cases = [
  {
    name: 'Виталий',
    before: 'Был хаос.',
    after: 'Появились правила.',
    image: vitaliyImg,
  },
  {
    name: 'Рустам',
    before: 'Торговля «по ощущениям».',
    after: 'Дисциплина и защита капитала.',
    image: rustamImg,
  },
  {
    name: 'Сергей',
    before: 'Страх нажать кнопку.',
    after: 'Сценарий и спокойствие.',
    image: lesyaImg,
  },
  {
    name: 'Елена',
    before: 'Эмоции сильнее правил.',
    after: 'Дисциплина и доверие процессу.',
    image: elenaImg,
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
            Не быстрые успехи, а дисциплина и работа по правилам.
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
                <p className="text-xs text-foreground font-medium">Стало: {item.after}</p>
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
