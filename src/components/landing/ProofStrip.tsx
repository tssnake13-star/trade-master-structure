/**
 * Доказательства перед ценами. До этого блока человек читал суммы,
 * не видя ни одной цифры по счёту.
 *
 * ⚠️ Числа берутся ТОЛЬКО из таблицы «TLT_Statement_Tactic1», срез 05.09.2026.
 * ⚠️ Win Rate никогда не показывается без соотношения риск-прибыль рядом
 * (требование Сергея 06.09.2026): 23,3% в отрыве читается как «система почти
 * всегда ошибается».
 * ⚠️ Средняя доходность 6,4% в месяц = 128,5% / 20 месяцев без компаундинга.
 * Рядом обязательна оговорка: прошлый результат не гарантирует будущий.
 */

const GOLD = 'hsl(var(--accent))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant', serif", fontWeight: 500 };

const NUMBERS: { value: string; label: string }[] = [
  { value: '20', label: 'месяцев подряд' },
  { value: '377', label: 'сделок' },
  { value: '6,4%', label: 'в месяц в среднем' },
  { value: '2,23%', label: 'максимальная просадка' },
];

export default function ProofStrip() {
  return (
    <div className="p-5 md:p-7" style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <div className="text-mono" style={{ ...MONO, color: GOLD }}>Прежде чем выбирать</div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-5">
        {NUMBERS.map((n) => (
          <div key={n.label}>
            <div style={{ ...SERIF, fontSize: 40, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{n.value}</div>
            <div className="text-mono mt-1.5" style={{ ...MONO, letterSpacing: '0.12em', color: 'hsl(var(--muted-foreground))' }}>{n.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 grid md:grid-cols-2 gap-x-10 gap-y-3" style={{ borderTop: '1px solid hsl(var(--rule-soft))' }}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          6,4% в месяц — это среднее за 20 месяцев, а не помесячная норма:
          <b className="text-foreground/85"> 3 месяца из 20 закрылись в минус</b>, лучший дал 10,2%.
          Риск 0,25% на сделку, профит-фактор 2,86.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Побед 23,3%. Средняя прибыльная сделка <b className="text-foreground/85">+9,40 R против −1,00 R</b> в убыточной —
          система живёт на редких крупных движениях, а не на частоте.
        </p>
      </div>

      <p className="mt-5 text-xs text-muted-foreground leading-relaxed" style={{ maxWidth: '80ch' }}>
        Это мой торговый журнал за январь 2025 — август 2026, депозит $50 000, без компаундинга. Не тест на истории.{' '}
        <b className="text-foreground/80">Прошлый результат не гарантирует будущий — ни мой, ни ваш.</b>
      </p>
    </div>
  );
}
