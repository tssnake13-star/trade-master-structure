import { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import rustamImg from '@/assets/testimonials/rustam.jpg';
import lesyaImg from '@/assets/testimonials/lesya.jpg';
import elenaImg from '@/assets/testimonials/elena.jpg';
import lesiaImg from '@/assets/testimonials/lesia.jpg';
import nikolayImg from '@/assets/testimonials/nikolay.jpg';
import elenaNewImg from '@/assets/testimonials/elena-new.jpg';
import pavelImg from '@/assets/testimonials/pavel.jpg';

/**
 * ProofSection — «04 · Отзывы».
 *
 * ⚠️ Переписан 13.09.2026. Прежние подписи «Было / Стало / Ключ» были
 * пересказом с одинаковым ритмом («Структура вместо хаоса», «Дисциплина
 * вместо хаоса»…) и для человека, прошедшего другие школы, читались как
 * сочинённые. Теперь в карточке ДОСЛОВНЫЕ выдержки из оригинала, который
 * открывается по нажатию. Правка только в пунктуации.
 *
 * Отзыв Виталия убран: в оригинале он пробует систему на бинарных опционах.
 * Для аудитории свинг-трейдинга это худший сигнал из возможных.
 *
 * Порядок — по совпадению с портретом клиента: сначала те, кто пришёл после
 * других школ с разрозненными знаниями.
 */

const cases = [
  {
    name: 'Елена М.',
    before: 'Несколько других школ. Растерянность при открытии сделок.',
    quote: 'Вы уверены в своих сделках. Если нет, Сергей рядом и направит. Вы спокойны, т.к. есть опора.',
    image: elenaNewImg,
  },
  {
    name: 'Николай',
    before: 'Прошёл две школы у двух разных преподавателей.',
    quote: 'Они дали мне базовые разрозненные знания, а школа Сергея Тё объединила и структурировала эти знания в целостную теорию.',
    image: nikolayImg,
  },
  {
    name: 'Pavel',
    before: 'Совершал новостные и интуитивные сделки, совершенно не понимая, куда идёт цена.',
    quote: 'Всё обучение разложено по полочкам, довольно понятно и просто, всё как я люблю.',
    image: pavelImg,
  },
  {
    name: 'Рустам',
    before: 'Проходил обучение пару лет назад.',
    quote: 'Хоть и знаешь, как надо, но делать как надо — это разные вещи.',
    image: rustamImg,
  },
  {
    name: 'Елена',
    before: 'Торгует основные пары и металлы.',
    quote: 'Вход в сделку очень прост, без суеты и внутреннего беспокойства, просто как сделать какую-то обыденную вещь.',
    image: elenaImg,
  },
  {
    name: 'Lesia',
    before: 'Путь длинный: курсы, годовые программы, практика, много-много практики.',
    quote: 'Крайние 6 месяцев закрылись в «плюс».',
    image: lesiaImg,
  },
  {
    name: 'Сергей',
    before: 'С 2017 года торговал по горизонтальным уровням.',
    quote: 'Всё, чему Вы учите, прекрасно работает!',
    image: lesyaImg,
  },
];

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="#2AABEE" className="w-4 h-4">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const CaseCard = ({ item, onOpen, mobile }: { item: typeof cases[0]; onOpen: () => void; mobile?: boolean }) => (
  <button
    onClick={onOpen}
    className={`${mobile ? 'snap-center shrink-0' : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20'} p-4 bg-card border border-border rounded-xl text-left transition-all duration-200 hover:border-muted-foreground/50 cursor-pointer group flex flex-col`}
    style={mobile ? { width: '85%' } : undefined}
  >
    <div className="flex items-center gap-2 mb-3">
      <User className="w-4 h-4 text-muted-foreground" />
      <span className="font-medium text-foreground text-sm">{item.name}</span>
    </div>
    <p className="text-xs text-muted-foreground mb-2">{item.before}</p>
    <p className="text-sm text-foreground leading-relaxed">«{item.quote}»</p>
    <div className="flex-grow" />
    <div className={`flex items-center gap-1.5 mt-3 ${mobile ? 'justify-end' : ''}`}>
      <TelegramIcon />
      <span className="text-xs text-[#2AABEE]/70 group-hover:text-[#2AABEE]">оригинал</span>
    </div>
  </button>
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
          <span className="section-label">04 · Отзывы</span>
          <h2 className="text-foreground">
            Знания у них <span className="mute">уже были.</span> Не хватало <em>системы.</em>
          </h2>

          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Отзывы без редактуры: в карточке выдержка, по нажатию открывается оригинал из Telegram.
          </p>

          {/* Mobile — horizontal scroll snap */}
          <div
            ref={scrollRef}
            className="mt-8 md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cases.map((item, index) => (
              <CaseCard key={index} item={item} onOpen={() => setSelectedCase(item)} mobile />
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
              <CaseCard key={index} item={item} onOpen={() => setSelectedCase(item)} />
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
