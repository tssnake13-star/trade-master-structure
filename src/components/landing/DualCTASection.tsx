import { lazy, Suspense } from 'react';
import { MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import FinalRing from './FinalRing';

// 23.10.2026, Сергей: «Ставь кольцо» — объёмное кольцо для всех (отдельный файл ~4 КБ); без WebGL — плоское
const FinalRing3D = lazy(() => import('./FinalRing3D'));

/**
 * Финал страницы в кольце. 28.10.2026 (сайт из нескольких страниц): «Проверьте свою сделку» —
 * то, что человек может сделать сам за минуту в пробные 7 дней. Честная строка рядом с предложением.
 */
const DualCTASection = () => {
  return (
    <section className="final-cta relative overflow-hidden py-12 md:py-20">
      {typeof window === 'undefined' ? <FinalRing /> : <Suspense fallback={null}><FinalRing3D /></Suspense>}
      <div className="container-landing relative" style={{ zIndex: 1 }}>
        <div data-ring-center className="final-cta__center">
          <h2 className="text-foreground text-center">
            {/* в две строки: целиком внутри кольца и на компьютере */}
            Проверьте<br />свою сделку
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto final-cta__cards">
          {/* главный вход — 7 дней через бота, чтобы человек остался в базе */}
          <div className="p-6 md:p-8 ns-glass text-center flex flex-col items-center">
            <p className="text-base md:text-lg text-foreground font-semibold mb-2">7 дней бесплатно</p>
            <p className="text-sm text-muted-foreground mb-6">
              Выберите пару и «покупка» или «продажа». Система сразу скажет, можно входить или нельзя, и почему.
              Сначала 4 коротких вопроса в Telegram-боте, дальше 7 дней весь терминал, как у подписчиков.
            </p>
            <div className="flex-grow" />
            <a
              href={TELEGRAM_LINKS.trial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('final_trial')}
              className="cta-trial btn-primary cta-shine group w-full justify-center"
            >
              7 дней бесплатно
            </a>
          </div>

          <div className="p-6 md:p-8 ns-glass text-center flex flex-col items-center">
            <p className="text-base md:text-lg text-foreground font-semibold mb-2">Остался вопрос</p>
            <p className="text-sm text-muted-foreground mb-6">Напишите мне в Telegram, отвечаю сам. Без звонков.</p>
            <div className="flex-grow" />
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('final_dm')}
              className="btn-secondary w-full justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Написать Сергею
            </a>
          </div>
        </div>

        <p className="mt-8 mx-auto text-center ns-honest">
          Торговли без убытков не бывает, и я её не обещаю. Зато риск каждой сделки известен до входа, а из 22 месяцев
          в минус закрылись только 3.
        </p>
      </div>
    </section>
  );
};

export default DualCTASection;
