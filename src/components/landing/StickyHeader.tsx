import { useState, useEffect } from 'react';
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
          className="cta-trial flex items-center justify-center gap-3 w-full py-2.5 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
          style={{ animation: 'ctaGlow 2s ease-in-out infinite' }}
        >
          {/* 08.10.2026 «бинокль впереди»: кнопка зовёт в 7 дней терминала. Ведёт через бота
              (?start=trial), чтобы человек остался в базе; бот присылает регистрацию.
              Вторая строка снимает страх платить до клика. Про карту не пишем нигде
              (Сергей 18.10.2026: «больше не упоминай это выражение»). */}
          <span className="flex flex-col items-center leading-tight">
            <span>Попробовать терминал 7 дней</span>
            <span className="text-xs font-normal opacity-75">после 4 вопросов, бесплатно</span>
          </span>
        </a>
      </div>
    </div>
  );
};

export default StickyHeader;
