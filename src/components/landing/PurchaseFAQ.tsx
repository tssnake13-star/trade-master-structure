import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { PURCHASE_FAQ } from '@/lib/purchaseFaq';

/**
 * Вопросы перед оплатой — только на /access, ниже цен экосистемы
 * (порядок задан Сергеем 06.09.2026). На лендинге остаётся свой FAQ:
 * там другая задача и другая глубина.
 *
 * Порядок бьёт по возражениям в том виде, в каком они возникают перед
 * оплатой: подходит ли мне → работает ли это → а если не выйдет →
 * почему столько стоит → что именно получу → почему вы.
 */

// 20.10.2026: список — в lib/purchaseFaq.ts (его же показывает вкладка «Цены» терминала школьного бота)
const faq = PURCHASE_FAQ;


export default function PurchaseFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mt-12 md:mt-16">
      <div className="max-w-3xl">
        <span className="section-label" style={{ color: 'hsl(var(--accent))' }}>Перед оплатой</span>
        <h2 className="text-foreground">
          Вопросы, которые <em>стоит задать</em>
        </h2>
      </div>

      <div className="mt-8 max-w-3xl">
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
                  style={{ color: 'hsl(var(--accent))', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                />
              </button>
              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? 620 : 0, opacity: isOpen ? 1 : 0 }}>
                <p className="pb-5 text-sm md:text-base text-muted-foreground" style={{ maxWidth: '64ch' }}>
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Остался вопрос?{' '}
        <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
          Напишите Сергею
        </a>{' '}
        — без звонков, всё в Telegram.
      </p>
    </div>
  );
}
