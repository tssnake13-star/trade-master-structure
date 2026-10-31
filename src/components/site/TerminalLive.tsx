import { useEffect, useRef, useState } from 'react';
import poster from '@/assets/site/terminal-live-poster.webp';
import posterSm from '@/assets/site/terminal-live-poster-1216.webp';

/**
 * Живой терминал на первом экране Бинокля (31.10.2026, Сергей: «сделать желательно её динамичной», запись его экрана).
 * Петля ровно 8 с: круг анимации самого терминала, данные на записи настоящие, снятые 31.10.
 * Снизу кадр-картинка: она видна до старта и там, где видео не идёт (экономия на iPhone, «меньше движения»).
 * Вне экрана видео стоит.
 */
export default function TerminalLive() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // большой файл только на экранах двойной плотности: на обычном уменьшенная копия чётче, браузер сжимает видео грубо
    v.src = v.clientWidth * window.devicePixelRatio > 1300 ? '/video/terminal-live.mp4' : '/video/terminal-live-1216.mp4';
    const seen = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => undefined);
      else v.pause();
    });
    seen.observe(v);
    return () => seen.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[5px]">
      <img src={poster} srcSet={`${posterSm} 1216w, ${poster} 2414w`} sizes="(min-width: 1280px) 1216px, 100vw"
        alt="Экран программы ECHO-GATE INSIDE: приборы, список пар, решение по неделе и дневке, анализ циклов" width={2414} height={1274} className="w-full h-auto block" />
      <video ref={video} muted loop playsInline preload="metadata" aria-hidden="true" onPlaying={() => setPlaying(true)}
        className="absolute inset-0 w-full h-full" style={{ opacity: playing ? 1 : 0, transition: 'opacity .3s' }} />
    </div>
  );
}
