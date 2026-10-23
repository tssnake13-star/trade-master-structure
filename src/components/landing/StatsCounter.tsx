import { AUTHOR_STATS } from '@/lib/authorStats';

// 20.10.2026: список — в lib/authorStats.ts (Win Rate и R:R — таблица счёта, см. там)
const stats = AUTHOR_STATS;

// 23.10.2026: отсчёт с нуля убран. Бегущие цифры похожи на табло автомата, а скриншот посреди
// отсчёта показывал неверное число. Цифра стоит сразу итоговая (блик по цифрам снят с обликом, шаг 4).
const StatItem = ({ value, suffix, label, decimals = 0, compact = false }: { value: number; suffix: string; label: string; decimals?: number; compact?: boolean }) => {
  const count = value;
  return (
    <div className={compact ? 'py-2 md:py-0' : 'text-center py-4 md:py-0'}>
      {/* в блоке «Автор» колонки уже: цифра мельче, чтобы «1000+» не вылезала за колонку */}
      <div className="stat-number text-foreground" style={compact ? { fontSize: 'clamp(36px, 4.2vw, 60px)' } : undefined}>
        {count.toFixed(decimals).replace('.', ',')}{suffix}
      </div>
      <div className="stat-label text-muted-foreground">{label}</div>
    </div>
  );
};

/**
 * 11.10.2026: полоса стояла под первым экраном и повторяла его и «Результаты».
 * Сергей: «перемести их тогда в блок автор». embedded — вариант внутри блока «Автор»,
 * без своей секции и рамки на всю ширину.
 */
const StatsCounter = ({ embedded = false }: { embedded?: boolean }) => {
  const grid = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
      {stats.map((s, i) => (
        <StatItem key={i} {...s} compact={embedded} />
      ))}
    </div>
  );

  if (embedded) {
    return (
      <div className="mt-10 md:mt-12 pt-8 border-t border-border">
        {grid}
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12 border-y border-border bg-card/30">
      <div className="container-landing">{grid}</div>
    </section>
  );
};

export default StatsCounter;
