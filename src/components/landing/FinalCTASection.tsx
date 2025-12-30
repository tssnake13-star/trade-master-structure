import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
const FinalCTASection = () => {
  return <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-section text-foreground">
            Готовы перестать угадывать и начать принимать решения по сценарию?
          </h2>
          
          <div className="mt-8 p-6 bg-secondary/30 border border-border rounded-xl text-left">
            <p className="text-muted-foreground leading-relaxed">
              Этот подход не гарантирует сделку каждый день. Он гарантирует, что вы перестанете принимать решения из тревоги.
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Для большинства трейдеров этого уже достаточно, чтобы результат начал меняться.
            </p>
          </div>
          
          <div className="mt-12 flex flex-col items-center">
            <p className="mb-3 text-sm text-muted-foreground/70">
              Здесь я разбираю рынок и сделки без сигналов и угадываний.
            </p>
            <a href={TELEGRAM_LINKS.channel} target="_blank" rel="noopener noreferrer" className="btn-primary group">
              Перейти в Telegram-канал
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              Разборы сделок, логика входов и путь к торговому алгоритму 🧠
            </p>
          </div>
        </div>
      </div>
    </section>;
};
export default FinalCTASection;