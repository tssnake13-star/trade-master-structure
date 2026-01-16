import { useState, useEffect } from 'react';
import { Menu, X, Send } from 'lucide-react';
import { NAV_ITEMS, TELEGRAM_LINKS } from '@/lib/constants';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Block scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/95 backdrop-blur-sm border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="container-landing">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="#" className="flex items-center">
              <span className="text-base md:text-lg font-semibold tracking-tight text-foreground">
                TRADELIKETYO
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <a
                href={TELEGRAM_LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                Проверить ошибку во входе
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground z-50"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark overlay background */}
        <div 
          className="absolute inset-0 bg-background"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu content */}
        <div 
          className={`absolute inset-0 flex flex-col pt-20 px-6 transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          <nav className="flex flex-col gap-6 mt-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl font-medium text-foreground hover:text-muted-foreground transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>
          
          <div className="mt-auto pb-12">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-all duration-200"
            >
              <Send className="w-5 h-5" />
              Проверить ошибку во входе
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
