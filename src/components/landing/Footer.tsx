import { TELEGRAM_LINKS } from '@/lib/constants';
import { Link } from 'react-router-dom';
import FooterWordmark from '@/components/fx/FooterWordmark';
import { v2 } from '@/lib/lookV2';

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container-landing">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            {/* 23.10.2026, Сергей: белое «TRADELIKETYO» дублировало большую надпись ниже — с глаз убрано,
                для поисковиков и программ чтения с экрана название остаётся */}
            <p className="sr-only">TRADELIKETYO</p>
            <p className="text-sm text-muted-foreground">Система допуска к сделке</p>
          </div>
          
          {/* Secondary links */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <a
              href={TELEGRAM_LINKS.channel}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Telegram-канал
            </a>
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Написать автору
            </a>
          </div>
        </div>

        {/* 23.10.2026: большая надпись прорисовывается контуром, когда подвал доходит до экрана */}
        <FooterWordmark />

        <div className="mt-8 pt-8 border-t border-border text-center">
          <Link
            to="/school"
            className="inline-block text-sm text-muted-foreground/60 hover:text-foreground transition-colors mb-4"
          >
            {v2('Уже в системе? Войти в школу →', 'Уже в системе? Войти в школу')}
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TRADELIKETYO. Все права защищены.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/60">
            <Link to="/privacy" className="hover:text-muted-foreground transition-colors">
              Политика конфиденциальности
            </Link>
            <Link to="/terms" className="hover:text-muted-foreground transition-colors">
              Пользовательское соглашение
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/50 max-w-3xl mx-auto leading-relaxed">
            Информация на сайте носит исключительно образовательный характер и не является инвестиционной рекомендацией. Торговля на финансовых рынках связана с рисками. Все решения вы принимаете самостоятельно.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
