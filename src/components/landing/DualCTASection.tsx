import { lazy, Suspense } from 'react';
import { MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import FinalRing from './FinalRing';

// 23.10.2026, Сергей: «Ставь кольцо» — объёмное кольцо для всех (отдельный файл ~4 КБ); без WebGL — плоское
const FinalRing3D = lazy(() => import('./FinalRing3D'));

const DualCTASection = () => {
  return (
    // 22.10.2026: последний экран по образцу Сергея — заголовок внутри светящегося кольца (FinalRing),
    // карточки заходят на низ кольца. Тексты и кнопки прежние.
    <section className="final-cta relative overflow-hidden py-12 md:py-20">
      {typeof window === 'undefined' ? <FinalRing /> : <Suspense fallback={null}><FinalRing3D /></Suspense>}
      <div className="container-landing relative" style={{ zIndex: 1 }}>
        <div data-ring-center className="final-cta__center">
          <h2 className="text-foreground text-center">
            {/* в две строки: целиком внутри кольца и на компьютере */}
            Первый шаг<br /><em>бесплатный</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto final-cta__cards">
          {/* Primary — пробный доступ (08.10.2026: главный вход; через бота, чтобы человек остался в базе) */}
          <div className="p-6 md:p-8 bg-card border border-border rounded-xl text-center flex flex-col items-center">
            <p className="text-base md:text-lg text-foreground font-medium mb-2">
              Посмотреть самому
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              7 дней терминала ECHO-GATE INSIDE бесплатно. Сначала бот в Telegram задаст 4 коротких вопроса:
              так я пойму, подходит ли вам система. Если подходит, терминал откроется прямо в Telegram.
            </p>
            <a
              href={TELEGRAM_LINKS.trial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('final_trial')}
              className="cta-trial btn-primary cta-shine group w-full justify-center"
            >
              Попробовать 7 дней
            </a>
          </div>

          {/* Secondary — DM */}
          <div className="p-6 md:p-8 bg-card border border-border rounded-xl text-center flex flex-col items-center">
            <p className="text-base md:text-lg text-foreground font-medium mb-2">
              Уже готов
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Напишу напрямую
            </p>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-foreground font-medium rounded-lg border border-border hover:border-muted-foreground/50 hover:bg-accent transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              Написать Сергею
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualCTASection;
