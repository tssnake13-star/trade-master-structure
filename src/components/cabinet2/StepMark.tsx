/** Отметка шага регистрации (30.10.2026): человек с самого начала видит, что после формы идёт ещё шаг с Telegram */
export default function StepMark({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="mb-5" role="group" aria-label={`Шаг ${step} из ${total}: ${label}`}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < step ? '#CDAA6E' : 'rgba(230,236,245,0.14)' }} />
        ))}
      </div>
      <p className="mt-2.5 text-center text-sm font-semibold" style={{ color: '#CDAA6E', fontFamily: 'var(--font)' }} aria-hidden="true">
        Шаг {step} из {total}: {label}
      </p>
    </div>
  );
}
