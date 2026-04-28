import { Link } from 'react-router-dom';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * Editorial footer — colophon style. Wordmark left, columns of links right,
 * single rule, disclaimer in mono.
 */
const RedesignFooter = () => {
  return (
    <footer className="border-t border-[hsl(var(--rule-soft))] py-16 md:py-20">
      <div className="container-landing">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14">
          {/* Wordmark */}
          <div className="md:col-span-5">
            <p className="font-['Fraunces'] text-3xl md:text-4xl text-foreground tracking-tight">
              TRADELIKETYO
            </p>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Система допуска к сделке. Не сигнал.
            </p>
            <p className="mt-6 text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground">
              EST · 2024 · MOSCOW · BERLIN
            </p>
          </div>

          {/* Index columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground mb-4">
                01 · CONTACT
              </p>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li>
                  <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--warm))] transition-colors">
                    Telegram-бот
                  </a>
                </li>
                <li>
                  <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--warm))] transition-colors">
                    Написать автору
                  </a>
                </li>
                <li>
                  <a href={TELEGRAM_LINKS.channel} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--warm))] transition-colors">
                    Канал
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground mb-4">
                02 · INDEX
              </p>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li><a href="#system" className="hover:text-[hsl(var(--warm))] transition-colors">Система</a></li>
                <li><a href="#proof" className="hover:text-[hsl(var(--warm))] transition-colors">Доказательства</a></li>
                <li><a href="#author" className="hover:text-[hsl(var(--warm))] transition-colors">Автор</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground mb-4">
                03 · ACCESS
              </p>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li>
                  <Link to="/school" className="hover:text-[hsl(var(--warm))] transition-colors">
                    Войти в школу →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="mt-16 pt-6 border-t border-[hsl(var(--rule-soft))] flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground">
          <span>© {new Date().getFullYear()} · TRADELIKETYO · ALL RIGHTS RESERVED</span>
          <span>FIG_END · COLOPHON</span>
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60 leading-relaxed max-w-3xl">
          Информация на сайте носит исключительно образовательный характер и не является
          инвестиционной рекомендацией. Торговля на финансовых рынках связана с рисками.
          Все решения вы принимаете самостоятельно.
        </p>
      </div>
    </footer>
  );
};

export default RedesignFooter;