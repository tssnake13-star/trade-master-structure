import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const StickyButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3">
        <a
          href={TELEGRAM_LINKS.bot}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
        >
          Встроить алгоритм
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};

export default StickyButton;
