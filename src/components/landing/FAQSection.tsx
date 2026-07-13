import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * FAQSection — «15 · Вопросы». Снятие последних сомнений перед финальным CTA:
 * депозит, время, «очередной курс?», «а если не получится», происхождение цифр,
 * техническая сложность. Лёгкий аккордеон без зависимостей (одна открыта за раз).
 */

const faq = [
  {
    q: 'С каким депозитом можно начинать?',
    a: 'Система работает от процента, а не от суммы: риск фиксирован — 0.25% на сделку, подход одинаковый на любом размере счёта. Стартовый размер обсуждается индивидуально — напишите Сергею, он подскажет под вашу ситуацию.',
  },
  {
    q: 'Сколько времени это занимает в день?',
    a: 'Рабочий таймфрейм системы — H4. Рынок проверяется несколько раз в день по 10–15 минут — сидеть у монитора не нужно. Исполнение и сопровождение сделок берёт на себя экосистема.',
  },
  {
    q: 'Чем это отличается от очередного курса?',
    a: 'Курс здесь — только первый этап. Продукт — механизм допуска и инфраструктура, которые остаются работать на вашем счёте после обучения. Школа учит принимать решения, экосистема следит за тем, чтобы вы их не нарушали.',
  },
  {
    q: 'А если у меня не получится?',
    a: 'Система специально не опирается на талант и «чувство рынка»: допуск говорит «да» или «нет» по правилам, большинство сделок отсеивается, а Risk Sentinel жёстко ограничивает потери — при −4% за неделю или −8% за месяц торговля блокируется. И мы берём не всех — см. блок «Фильтр».',
  },
  {
    q: 'Откуда цифры статистики?',
    a: 'Из журнала сделок системы: 319 сделок за 18 месяцев, риск 0.25% на сделку, без компаундинга. Разборы реальных сделок — в блоке «Сделки», оригиналы отзывов открываются скринами из Telegram.',
  },
  {
    q: 'Нужно ли разбираться в программировании?',
    a: 'Нет. Echo Gate, Hunter Bot и Risk Sentinel — готовая инфраструктура: устанавливается и настраивается вместе с вами, дальше работает сама.',
  },
];

const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">15 · Вопросы</span>
          <h2 className="text-foreground">
            Частые <em>вопросы</em>
          </h2>
        </div>

        <div className="mt-8 md:mt-10 max-w-3xl">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-border">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                >
                  <span className="text-base md:text-lg text-foreground font-medium">{item.q}</span>
                  <Plus
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                    style={{
                      color: 'hsl(var(--accent))',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? 300 : 0, opacity: isOpen ? 1 : 0 }}
                >
                  <p className="pb-5 text-sm md:text-base text-muted-foreground" style={{ maxWidth: '60ch' }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Остался вопрос?{' '}
          <a
            href={TELEGRAM_LINKS.dm}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Напишите Сергею
          </a>{' '}
          — без звонков, всё в Telegram.
        </p>
      </div>
    </section>
  );
};

export default FAQSection;
