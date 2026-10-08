import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
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
          href={TELEGRAM_LINKS.trial}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('sticky_trial')}
          className="flex items-center justify-center gap-3 w-full py-2.5 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
          style={{ animation: 'ctaGlow 2s ease-in-out infinite' }}
        >
          {/* 08.10.2026 «бинокль впереди»: кнопка зовёт в 7 дней терминала. Ведёт через бота
              (?start=trial), чтобы человек остался в базе; бот присылает регистрацию.
              Вторая строка снимает два страха до клика: платить и привязывать карту. */}
          <span className="flex flex-col items-center leading-tight">
            <span>Попробовать терминал 7 дней</span>
            <span className="text-xs font-normal opacity-75">бесплатно, карта не нужна</span>
          </span>
          <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
};

export default StickyHeader;
