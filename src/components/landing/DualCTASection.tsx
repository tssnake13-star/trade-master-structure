import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const DualCTASection = () => {
  return (
    <section className="py-12 md:py-20">
      <div className="container-landing">
        <h2 className="heading-section text-foreground text-center mb-8 md:mb-12">
          Следующий шаг — за вами
        </h2>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
          {/* Primary — Bot */}
          <div className="p-6 md:p-8 bg-card border border-border rounded-xl text-center flex flex-col items-center">
            <p className="text-base md:text-lg text-foreground font-medium mb-2">
              Хочу разобраться
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Начну с системы допуска
            </p>
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group w-full justify-center"
            >
              Перейти в Telegram-бот
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
