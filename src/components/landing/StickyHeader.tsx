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
      <div className="bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container-landing flex items-center justify-between h-12 md:h-14">
          <video
            src={logoVideo}
            autoPlay
            muted
            loop
            playsInline
            className="h-6 md:h-7 w-auto"
          />
          <a
            href={TELEGRAM_LINKS.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs md:text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all"
            style={{ animation: 'ctaGlow 2s ease-in-out infinite' }}
          >
            Получить систему допуска
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default StickyHeader;
