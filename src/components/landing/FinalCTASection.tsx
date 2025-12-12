import { ArrowRight, Send, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
const FinalCTASection = () => {
  return <section className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-section text-foreground">
            Готовы перестать угадывать
            <br />
            и начать торговать по сценарию?
          </h2>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-primary group">Пройти диагностику трейдера<Send className="w-4 h-4 mr-2" />
              Записаться в программу
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="btn-secondary group">
              <MessageCircle className="w-4 h-4 mr-2" />
              Получить консультацию
            </a>
          </div>
        </div>
      </div>
    </section>;
};
export default FinalCTASection;