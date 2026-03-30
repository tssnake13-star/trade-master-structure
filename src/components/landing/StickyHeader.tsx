import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import logoVideo from '@/assets/logo-video.mp4';

const StickyHeader = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] md:hidden transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}
    >
      <div className="bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3">
        <a
          href={TELEGRAM_LINKS.bot}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
          style={{ animation: 'ctaGlow 2s ease-in-out infinite' }}
        >
          Получить систему допуска
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};

export default StickyHeader;
