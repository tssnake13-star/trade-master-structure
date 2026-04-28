import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import vitaliyImg from '@/assets/testimonials/vitaliy.jpg';
import rustamImg from '@/assets/testimonials/rustam.jpg';
import lesyaImg from '@/assets/testimonials/lesya.jpg';
import elenaImg from '@/assets/testimonials/elena.jpg';
import lesiaImg from '@/assets/testimonials/lesia.jpg';
import nikolayImg from '@/assets/testimonials/nikolay.jpg';
import elenaNewImg from '@/assets/testimonials/elena-new.jpg';
import pavelImg from '@/assets/testimonials/pavel.jpg';

/**
 * RedesignProof — editorial list of testimonials.
 * Data (name / before / after / key) is unchanged from ProofSection.
 */
const cases = [
  { name: 'Виталий', before: 'Хаотичные входы, постоянные сомнения.', after: 'Чёткий фильтр, меньше действий, больше уверенности.', key: 'Структура вместо хаоса', image: vitaliyImg },
  { name: 'Рустам', before: 'Попытки ловить каждое движение.', after: 'Работа только по допуску, без перегрузки.', key: 'Меньше действий — больше результата', image: rustamImg },
  { name: 'Сергей', before: 'Сильный анализ, слабые решения.', after: 'Структура, которая фиксирует действия.', key: 'Решения стали системными', image: lesyaImg },
  { name: 'Елена', before: 'Страх после входа.', after: 'Понимание, почему сделка открыта.', key: 'Ясность вместо тревоги', image: elenaImg },
  { name: 'Lesia', before: 'Постоянные сомнения.', after: 'Ясность в каждом действии.', key: 'Уверенность через систему', image: lesiaImg },
  { name: 'Николай', before: 'Перегруз информацией.', after: 'Один алгоритм вместо хаоса.', key: 'Знания сложились в систему', image: nikolayImg },
  { name: 'Елена М.', before: 'Эмоциональные решения.', after: 'Работа через фильтр.', key: 'Опора вместо импульса', image: elenaNewImg },
  { name: 'Pavel', before: 'Отсутствие системности.', after: 'Последовательная работа.', key: 'Дисциплина вместо хаоса', image: pavelImg },
];

const monoLabel: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
};

const RedesignProof = () => {
  const [selected, setSelected] = useState<typeof cases[0] | null>(null);

  return (
    <section id="proof" className="py-24 md:py-32 lg:py-40">
      <div className="container-landing">
        <div className="kicker reveal mb-8">
          <span className="num">04</span>
          <span className="dot" />
          <span>VOICES · ОТЗЫВЫ</span>
        </div>
        <h2 className="reveal max-w-[20ch] mb-6 text-foreground">
          Что меняется, когда <em>появляется</em> система.
        </h2>
        <p className="lede reveal mb-16" style={{ transitionDelay: '120ms' }}>
          Не быстрые результаты. Изменение мышления и структуры.
          Нажмите на запись — оригинал из Telegram.
        </p>

        <div className="reveal" style={{ transitionDelay: '200ms' }}>
          {cases.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(item)}
              className="group block w-full text-left"
              style={{
                borderTop:
                  i === 0 ? '1px solid hsl(var(--rule-soft))' : 'none',
                borderBottom: '1px solid hsl(var(--rule-soft))',
                padding: '36px 0',
              }}
            >
              {/* Desktop row */}
              <div className="hidden md:grid items-start gap-8" style={{ gridTemplateColumns: '200px 1fr 200px' }}>
                {/* Photo */}
                <div
                  className="overflow-hidden bg-secondary"
                  style={{ aspectRatio: '4 / 5', width: 200 }}
                >
                  <img
                    src={item.image}
                    alt={`Отзыв ${item.name}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Center: name + before/after */}
                <div>
                  <div className="text-foreground" style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, lineHeight: 1.2 }}>
                    {item.name}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-6">
                    <div>
                      <div style={{ ...monoLabel, color: 'hsl(var(--muted-foreground) / 0.55)' }}>было</div>
                      <p className="mt-2 text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.55 }}>
                        {item.before}
                      </p>
                    </div>
                    <div>
                      <div style={{ ...monoLabel, color: 'hsl(var(--cool))' }}>стало</div>
                      <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.55, color: 'hsl(var(--foreground))' }}>
                        {item.after}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: key + link */}
                <div className="flex flex-col items-start md:items-end justify-between h-full text-right">
                  <p
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: 19,
                      lineHeight: 1.3,
                      color: 'hsl(var(--warm))',
                      maxWidth: '18ch',
                    }}
                  >
                    «{item.key}»
                  </p>
                  <span
                    className="mt-4 group-hover:text-foreground transition-colors"
                    style={{ ...monoLabel, color: 'hsl(var(--muted-foreground) / 0.55)' }}
                  >
                    → оригинал в TG
                  </span>
                </div>
              </div>

              {/* Mobile row */}
              <div className="md:hidden grid items-start gap-4" style={{ gridTemplateColumns: '80px 1fr' }}>
                <div className="overflow-hidden bg-secondary" style={{ aspectRatio: '4 / 5' }}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-foreground" style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 19, lineHeight: 1.2 }}>
                    {item.name}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span style={{ ...monoLabel, color: 'hsl(var(--muted-foreground) / 0.55)' }}>было · </span>
                      <span className="text-muted-foreground" style={{ fontSize: 13 }}>{item.before}</span>
                    </div>
                    <div>
                      <span style={{ ...monoLabel, color: 'hsl(var(--cool))' }}>стало · </span>
                      <span style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>{item.after}</span>
                    </div>
                  </div>
                  <p
                    className="mt-3"
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: 15,
                      color: 'hsl(var(--warm))',
                    }}
                  >
                    «{item.key}»
                  </p>
                  <span className="mt-2 block" style={{ ...monoLabel, color: 'hsl(var(--muted-foreground) / 0.55)' }}>
                    → оригинал в TG
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden">
            <DialogTitle className="sr-only">{selected?.name ?? 'Отзыв'}</DialogTitle>
            {selected && (
              <div className="relative">
                <div className="p-4 border-b border-border">
                  <span className="font-medium text-foreground">{selected.name}</span>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  <img src={selected.image} alt={selected.name} className="w-full h-auto" />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default RedesignProof;