import { useRef, useState } from 'react';
import { ArrowRight, Play, RotateCcw } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';

/**
 * Ролик файлом с нашего сайта (31.10.2026, Сергей: «если человек из России, он не сможет ролик посмотреть… давай файлом, чтобы всем
 * было доступно»; «карту школы тоже»). Вид прежний (.smv в v3-skin.css): обложка с кнопкой, видео грузится только после нажатия,
 * в конце вход в пробу. Файлы лежат в public/video.
 */
export default function SiteVideo({
  src,
  cover,
  coverAlt,
  coverSize,
  label,
  time,
  endTitle,
  track,
  ratio,
  wide = false,
}: {
  src: string;
  cover: string;
  coverAlt: string;
  coverSize: [number, number];
  label: string;
  time: string;
  endTitle: string;
  /** начало имени события в аналитике: <track>_play, <track>_trial */
  track: string;
  /** пропорция кадра, если ролик не 16:9 */
  ratio?: string;
  /** во всю ширину блока, а не в обычную ширину ролика */
  wide?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'playing' | 'ended'>('idle');

  const replay = () => {
    setState('playing');
    if (video.current) {
      video.current.currentTime = 0;
      void video.current.play();
    }
  };

  return (
    <div className="smv" style={wide ? { maxWidth: 'none' } : undefined}>
      {/* 23.10.2026: свечение за роликом дышит, пока ролик не запущен; пока идёт, свет стоит ровно и не отвлекает */}
      <div className="smv-stage" data-state={state === 'idle' ? 'idle' : 'playing'}>
        <div className="smv-frame" style={ratio ? { aspectRatio: ratio } : undefined}>
          {state !== 'idle' && (
            <video
              ref={video}
              src={src}
              poster={cover}
              controls
              autoPlay
              playsInline
              preload="auto"
              onEnded={() => setState('ended')}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
            />
          )}
          {state === 'idle' && (
            <button type="button" className="smv-cover" onClick={() => { trackClick(`${track}_play`); setState('playing'); }} aria-label={label}>
              <img src={cover} alt={coverAlt} loading="lazy" decoding="async" width={coverSize[0]} height={coverSize[1]} />
              <span className="smv-play" data-loading="0"><Play className="w-7 h-7" fill="currentColor" /></span>
              <span className="smv-time">{time}</span>
            </button>
          )}
          {state === 'ended' && (
            <div className="smv-end">
              <p className="smv-end-title">{endTitle}</p>
              <p className="smv-end-sub">7 дней весь терминал бесплатно, как у подписчиков</p>
              <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" className="v3h-btn v3h-btn--solid" onClick={() => trackClick(`${track}_trial`)}>
                7 дней бесплатно <ArrowRight className="arr w-4 h-4" />
              </a>
              <button type="button" className="smv-replay" onClick={replay}>
                <RotateCcw className="w-3.5 h-3.5" /> Посмотреть ещё раз
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
