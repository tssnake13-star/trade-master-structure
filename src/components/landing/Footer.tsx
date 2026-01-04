import { TELEGRAM_LINKS } from '@/lib/constants';

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container-landing">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold text-foreground">TRADELIKETYO</p>
            <p className="text-sm text-muted-foreground mt-1">TRADE MASTER — система структурного анализа</p>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href={TELEGRAM_LINKS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Telegram-канал
            </a>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Написать автору
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TRADELIKETYO. Все права защищены.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            Информация на сайте носит исключительно образовательный характер и не является инвестиционной рекомендацией. Торговля на финансовых рынках связана с рисками. Все решения вы принимаете самостоятельно.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
