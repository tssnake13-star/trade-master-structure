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
            
            
            <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="btn-secondary group">
              <Send className="w-4 h-4 mr-2" />
              Пройти диагностику трейдера
            </a>
          </div>
        </div>
      </div>
    </section>;
};
export default FinalCTASection;