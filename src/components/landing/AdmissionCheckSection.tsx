import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * AdmissionCheckSection — «11 · Допуск». Интерактивная мини-демка Echo Gate:
 * посетитель описывает свой сетап тремя ответами, система выносит вердикт.
 * Все ответы структурные → «Допуск» + CTA в бота. Любая ошибка → «Отказ», но
 * кнопка остаётся с другим текстом (отказ — продающий момент, лид не теряется).
 */

const GOLD = 'hsl(var(--accent))';
const MONO: React.CSSProperties = { fontFamily: "'Space Mono', ui-monospace, monospace", textTransform: 'uppercase' };

type Q = { label: string; options: { text: string; ok: boolean }[] };

const QUESTIONS: Q[] = [
  {
    label: '01 · Куда смотрит тренд W1?',
    options: [
      { text: 'По движению', ok: true },
      { text: 'Против движения', ok: false },
      { text: 'Во флэте', ok: false },
    ],
  },
  {
    label: '02 · Что даёт триггер входа?',
    options: [
      { text: 'Структура H4', ok: true },
      { text: 'Новость', ok: false },
      { text: 'Сигнал из канала', ok: false },
    ],
  },
  {
    label: '03 · Потенциал сделки R:R?',
    options: [
      { text: '3:1 и выше', ok: true },
      { text: '1:1', ok: false },
      { text: 'Не считаю', ok: false },
    ],
  },
];

export default function AdmissionCheckSection() {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);

  const answered = answers.every(a => a !== null);
  const passed = answered && answers.every((a, i) => a !== null && QUESTIONS[i].options[a].ok);
  const pick = (qi: number, oi: number) => setAnswers(prev => prev.map((a, i) => (i === qi ? oi : a)));
  const reset = () => setAnswers([null, null, null]);

  return (
    <section id="admission-check" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">11 · Допуск</span>
          <h2 className="text-foreground">
            Проверьте сделку через <em>допуск</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '56ch' }}>
            Опишите свой типичный вход тремя ответами — и посмотрите, что скажет система.
            Так работает фильтр Echo Gate: не «нравится / не нравится», а структура.
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid md:grid-cols-5 gap-3 items-stretch">
          {/* questions */}
          <div className="md:col-span-3 p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            {QUESTIONS.map((q, qi) => (
              <div key={q.label} className={qi < QUESTIONS.length - 1 ? 'mb-6' : ''}>
                <div className="text-mono mb-3" style={{ ...MONO, fontSize: 10, letterSpacing: '0.2em', color: 'hsl(var(--muted-foreground))' }}>
                  {q.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((o, oi) => {
                    const on = answers[qi] === oi;
                    // после вердикта неверный выбор подсвечивается красным — микро-урок
                    const wrong = answered && on && !o.ok;
                    return (
                      <button
                        key={o.text}
                        onClick={() => pick(qi, oi)}
                        className="px-4 py-2 text-sm transition-all duration-200"
                        style={{
                          border: `1px solid ${wrong ? 'hsl(var(--destructive) / 0.6)' : on ? GOLD : 'hsl(var(--border))'}`,
                          background: wrong ? 'hsl(var(--destructive) / 0.07)' : on ? 'hsl(var(--accent) / 0.08)' : 'transparent',
                          color: wrong ? 'hsl(var(--destructive))' : on ? GOLD : 'hsl(var(--foreground) / 0.85)',
                        }}
                      >
                        {o.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* verdict */}
          <div
            className="md:col-span-2 p-6 md:p-7 flex flex-col justify-center"
            style={{
              minHeight: 280, // фиксируем высоту — вердикт меняется без прыжка макета на мобиле
              border: `1px solid ${answered ? (passed ? 'hsl(var(--accent) / 0.45)' : 'hsl(var(--destructive) / 0.4)') : 'hsl(var(--border))'}`,
              borderLeft: `2px solid ${answered ? (passed ? GOLD : 'hsl(var(--destructive) / 0.7)') : 'hsl(var(--border))'}`,
              background: answered && passed
                ? 'radial-gradient(120% 90% at 0% 0%, hsl(var(--accent) / 0.1), hsl(var(--card)) 60%)'
                : 'hsl(var(--card))',
            }}
          >
            <div className="text-mono mb-3" style={{ ...MONO, fontSize: 10, letterSpacing: '0.24em', color: 'hsl(var(--muted-foreground))' }}>
              Вердикт системы
            </div>

            <div key={!answered ? 'wait' : passed ? 'pass' : 'fail'} className="tly-rise flex flex-col items-start">
            {!answered ? (
              <>
                <div className="font-serif" style={{ fontSize: 26, fontWeight: 500, color: 'hsl(var(--muted-foreground))', lineHeight: 1.1 }}>
                  Ожидание ответов…
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Ответьте на три вопроса — система оценит сетап, как это делает фильтр допуска.
                </p>
              </>
            ) : passed ? (
              <>
                <div className="font-serif" style={{ fontSize: 32, fontWeight: 500, color: GOLD, lineHeight: 1 }}>
                  Допуск ✓
                </div>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.85)' }}>
                  Сетап структурный: тренд, триггер и математика на вашей стороне. Такой вход
                  проходит фильтр — дальше дело за исполнением и риском.
                </p>
                <a
                  href={TELEGRAM_LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-5 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium group"
                >
                  Получить систему допуска
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </>
            ) : (
              <>
                <div className="font-serif" style={{ fontSize: 32, fontWeight: 500, color: 'hsl(var(--destructive))', lineHeight: 1 }}>
                  Отказ
                </div>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.85)' }}>
                  Именно такие входы система блокирует: эмоция и чужое мнение вместо структуры.
                  Это не приговор — это точка роста.
                </p>
                <a
                  href={TELEGRAM_LINKS.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mt-5 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium group"
                >
                  Научиться проходить фильтр
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </>
            )}
            </div>

            {answered && (
              <button
                onClick={reset}
                className="mt-4 inline-flex items-center gap-2 text-xs transition-colors hover:text-foreground"
                style={{ ...MONO, fontSize: 10, letterSpacing: '0.16em', color: 'hsl(var(--muted-foreground))' }}
              >
                <RotateCcw size={11} /> Проверить другой сетап
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
