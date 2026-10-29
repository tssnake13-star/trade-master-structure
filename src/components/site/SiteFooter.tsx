import { Link } from 'react-router-dom';
import { TELEGRAM_LINKS } from '@/lib/constants';
import FooterWordmark from '@/components/fx/FooterWordmark';
import { SITE_PAGES } from './pages';

/** Подвал сайта из нескольких страниц (28.10.2026): страницы сайта, связь, документы, большая надпись контуром. */
export default function SiteFooter() {
  return (
    <footer className="pt-14 pb-12 border-t border-border">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div>
            <p className="ns-brand">TRADE LIKE TYO</p>
            <p className="mt-2 text-sm text-muted-foreground">Система допуска к сделке</p>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-base" aria-label="Страницы сайта внизу">
            {SITE_PAGES.map((p) => (
              <Link key={p.to} to={p.to} className="text-muted-foreground hover:text-foreground transition-colors">
                {p.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-base">
            <a href={TELEGRAM_LINKS.channel} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              Telegram-канал
            </a>
            <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              Написать Сергею
            </a>
          </div>
        </div>

        {/* 23.10.2026: большая надпись прорисовывается контуром, когда подвал доходит до экрана */}
        <FooterWordmark />

        <div className="mt-8 pt-8 border-t border-border text-center">
          <Link to="/school" className="inline-block text-sm text-muted-foreground/70 hover:text-foreground transition-colors mb-4">
            Уже в системе? Войти в школу
          </Link>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TRADELIKETYO. Все права защищены.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/70">
            <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-muted-foreground transition-colors">Пользовательское соглашение</Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground/60 max-w-3xl mx-auto leading-relaxed">
            Информация на сайте носит образовательный характер и не является инвестиционной рекомендацией. Торговля на
            финансовых рынках связана с риском. Все решения вы принимаете сами.
          </p>
        </div>
      </div>
    </footer>
  );
}
