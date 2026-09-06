import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * FAQSection — «16 · Вопросы». Снятие последних сомнений перед финальным CTA:
 * отличие от «очередного курса», «а если не получится», возврат денег, время,
 * происхождение цифр, техническая сложность. Порядок — по приоритету для ЦА
 * (опытные трейдеры перед оплатой). Лёгкий аккордеон (одна открыта за раз).
 */

const faq = [
  {
    q: 'Чем это отличается от очередного курса?',
    a: 'После обучения у вас остаётся главный инструмент — механизм допуска: алгоритм, который говорит сделке «да» или «нет». Это ваше навсегда. Экосистема (триггеры от бота, роботы) — отдельный продукт по подписке. Исключение — пакет VIP: советники Risk Sentinel и Hunter Bot остаются на вашем счёте.',
  },
  {
    q: 'А если у меня не получится?',
    a: 'Честный ответ: если правила соблюдать вы не готовы — не получится, поэтому мы и берём не всех (см. блок «Фильтр»). Система снимает эмоции с решений: допуск отвечает «да» или «нет», Risk Sentinel блокирует торговлю при −4% за неделю или −8% за месяц. Ваша часть работы — следовать правилам.',
  },
  {
    q: 'Можно ли вернуть деньги?',
    a: 'На практикуме и годовой программе действует правило первого блока: первый блок вводный, пройдите его целиком и решите. Не ваше — возвращаю деньги в полном объёме, объяснять ничего не нужно. Открыли второй блок — значит решение принято, и дальше мы идём до конца. На самостоятельном курсе возврата нет: это самая низкая цена входа, и система открывается целиком в первый же день. Инструменты — роботы и индикаторы — не возвращаются никогда: они лицензируются под номер вашего торгового счёта, и отозвать доступ после выдачи технически невозможно.',
  },
  {
    q: 'Сколько времени занимает торговля по системе?',
    a: 'Рабочие таймфреймы — неделя, день и H4. Раз в неделю, на выходных, — 30–60 минут на разбор рынка и отбор инструментов, от которых ждать точку входа. Дальше в течение недели — короткая проверка триггера каждые 4 часа. Подписчикам экосистемы триггеры присылает бот; когда они появятся — решает рынок.',
  },
  {
    q: 'Откуда цифры статистики?',
    a: 'Из личного торгового журнала автора: 377 сделок за 20 месяцев, риск 0,25% на сделку, без компаундинга. В среднем это 6,4% в месяц, при этом 3 месяца из 20 закрылись в минус. Побед 23,3%, средняя прибыльная сделка +9,40 R против −1,00 R в убыточной. Прошлый результат не гарантирует будущий. Разборы реальных сделок — в блоке «Сделки»: оригиналы открываются скринами из дневника сделок.',
  },
  {
    q: 'Нужно ли разбираться в программировании?',
    a: 'Нет — главное понимать причинно-следственные связи. Echo Gate, Hunter Bot и Risk Sentinel устанавливаются и настраиваются вместе с вами. Достаточно базовых навыков работы с компьютером и файлами.',
  },
];

const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">16 · Вопросы</span>
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
                  style={{ maxHeight: isOpen ? 560 : 0, opacity: isOpen ? 1 : 0 }}
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
