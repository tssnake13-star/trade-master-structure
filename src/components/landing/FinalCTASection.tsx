import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
const FinalCTASection = () => {
  return <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-section text-foreground">
            Готовы перестать угадывать и начать принимать решения по сценарию?
          </h2>
          
          <div className="mt-12 flex flex-col items-center">
            <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-primary group">
              Получить торговый алгоритм
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              7 коротких вопросов → в конце вы получите мой рабочий алгоритм торговли
            </p>
          </div>
        </div>
      </div>
    </section>;
};
export default FinalCTASection;