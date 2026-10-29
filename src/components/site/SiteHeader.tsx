import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import logoVideoFallback from '@/assets/logo-header.mp4';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import { SITE_PAGES } from './pages';

/**
 * Шапка сайта из нескольких страниц (28.10.2026). Сергей: «нужно сделать несколько страниц…
 * на каждой странице была ссылка или кнопка». Меню ведёт на страницы, а не к разделам одной страницы.
 * Справа одна кнопка — 7 дней бесплатно через бота. После первого экрана шапка становится стеклом.
 */
export default function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const logoVideo = useSiteAsset(SITE_ASSET_KEYS.headerLogo, logoVideoFallback);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className="ns-header fixed top-0 left-0 right-0 z-50" data-solid={solid || open ? '' : undefined}>
        <div className="container-landing">
          <div className="flex items-center justify-between gap-6 h-16 md:h-[72px]">
            <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="TRADE LIKE TYO, главная">
              <span className="h-10 w-10 md:h-11 md:w-11 overflow-hidden rounded flex-shrink-0" style={{ background: 'rgba(230,236,245,0.05)' }}>
                <video key={logoVideo} src={logoVideo} autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover" />
              </span>
              <span className="ns-brand hidden sm:inline">TRADE LIKE TYO</span>
            </Link>

            <nav className="ns-nav hidden lg:flex items-center gap-8" aria-label="Страницы сайта">
              {SITE_PAGES.map((p) => (
                <NavLink key={p.to} to={p.to} end>
                  {p.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={TELEGRAM_LINKS.trial}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('header_trial')}
                className="cta-trial hidden md:inline-flex items-center px-5 py-2.5 text-base font-semibold rounded-[3px]"
              >
                7 дней бесплатно
              </a>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden p-2 text-foreground"
                aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={open}
              >
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* меню телефона и планшета: те же страницы крупно, кнопка внизу */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(6,10,18,0.96)', backdropFilter: 'blur(10px)' }} onClick={() => setOpen(false)} />
        <div className={`relative h-full flex flex-col pt-24 px-6 transition-transform duration-300 ${open ? 'translate-y-0' : '-translate-y-3'}`}>
          <nav className="ns-nav flex flex-col gap-5" aria-label="Страницы сайта">
            {SITE_PAGES.map((p) => (
              <NavLink key={p.to} to={p.to} end onClick={() => setOpen(false)} className="!text-[28px] !font-semibold self-start" tabIndex={open ? 0 : -1}>
                {p.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto pb-12">
            <a
              href={TELEGRAM_LINKS.trial}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { trackClick('header_trial'); setOpen(false); }}
              className="cta-trial inline-flex items-center px-6 py-3.5 font-semibold rounded-[3px]"
              tabIndex={open ? 0 : -1}
            >
              7 дней бесплатно
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
