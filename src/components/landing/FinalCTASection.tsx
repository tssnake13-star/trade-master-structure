import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const FinalCTASection = () => {
  return (
    <section className="py-16 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-section text-foreground">
            Готовы перестать угадывать?
          </h2>
          
          <p className="mt-6 text-lg text-muted-foreground">
            Получи алгоритм, который работает. Без сигналов. Без угадывания.
          </p>
          
          <div className="mt-10 flex flex-col items-center">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group text-lg px-8 py-4"
            >
              Забрать алгоритм в Telegram
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              Бесплатный разбор ваших ошибок
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;