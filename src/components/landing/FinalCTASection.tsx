import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const FinalCTASection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="heading-section text-foreground">
            Готовы работать по системе?
          </h2>
          
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Структура вместо хаоса. Правила вместо угадывания.
          </p>
          
          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group text-base md:text-lg px-6 py-3.5"
            >
              Разобрать мою ситуацию бесплатно
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              Написать Сергею Тё
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
