import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const FinalCTASection = () => {
  return (
    <section className="section-animate py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-2xl mx-auto text-center">
          <span className="section-label block">015 · Допуск</span>
          <h2 className="text-foreground">
            Заберите <em>систему</em> <span className="mute">допуска</span>
          </h2>
          
          <div className="mt-4 space-y-3 text-base md:text-lg text-muted-foreground">
            <p>Вы пройдёте короткую фильтрацию</p>
            <p>
              И получите PDF<br />
              в котором показано<br />
              как принимается решение
            </p>
            <p className="text-foreground font-medium">Это не обучение</p>
            <p>
              Это точка,<br />
              где становится понятно<br />
              почему вы теряете
            </p>
          </div>
          
          <div className="mt-8">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group text-base md:text-lg px-6 py-3.5"
            >
              Перейти в Telegram
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
