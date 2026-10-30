import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play, RotateCcw } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import preview from '@/assets/karta-shkoly-preview.jpg';

/**
 * Ролик «Карта школы» в «09 · Сотрудничество» (22.10.2026). Сергей через сессию «Уникальные
 * навыки и монетизация»: ролик заменяет страницу цен /access — схему путей и 5 этапов теперь
 * объясняет он. Широкий ролик 4:35: общая дверь (7 дней бесплатно), бинокль, микроскоп, Леся.
 *
 * Сначала видно только превью: скрипты YouTube грузятся по нажатию, страница от них не тяжелеет.
 * Когда ролик кончится, вместо рекомендаций YouTube встаёт кнопка «7 дней бесплатно» — тот же
 * вход, что у главной кнопки сайта: в ролике звучит «ссылка в описании», а здесь она прямо под рукой.
 */

const VIDEO_ID = 'iHDuLkbd1BE';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return apiPromise;
}

// showCaption=false — когда над роликом свой заголовок раздела (страница «Микроскоп», 28.10.2026)
export default function SchoolMapVideo({ showCaption = true }: { showCaption?: boolean }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'ended'>('idle');

  useEffect(() => () => { player.current?.destroy?.(); }, []);

  const start = async () => {
    if (state !== 'idle') return;
    trackClick('map_video_play');
    setState('loading');
    await loadYouTubeApi();
    if (!holder.current) return;
    const mount = document.createElement('div');
    holder.current.appendChild(mount);
    player.current = new window.YT.Player(mount, {
      videoId: VIDEO_ID,
      host: 'https://www.youtube-nocookie.com',
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
      events: {
        onReady: (e: any) => { e.target.playVideo(); setState('playing'); },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.ENDED) setState('ended');
          else if (e.data === window.YT.PlayerState.PLAYING) setState('playing');
        },
      },
    });
  };

  const replay = () => {
    setState('playing');
    player.current?.seekTo?.(0, true);
    player.current?.playVideo?.();
  };

  return (
    <div className="smv">
      {showCaption && (
        <p className="smv-caption">
          Не знаете, какой путь ваш? <span>Карта школы за 4,5 минуты</span>
        </p>
      )}
      {/* 23.10.2026: свечение за роликом дышит (Сергей: «чтобы это свечение было динамичное… пульсировала»);
          пока ролик идёт, свет стоит ровно и не отвлекает */}
      <div className="smv-stage" data-state={state}>
        <div className="smv-frame">
          {/* сюда YouTube вставляет плеер — только после нажатия */}
          <div ref={holder} className="smv-holder" />

          {(state === 'idle' || state === 'loading') && (
            <button type="button" className="smv-cover" onClick={start} aria-label="Смотреть ролик «Карта школы», 4 минуты 35 секунд">
              <img src={preview} alt="Карта школы TRADELIKETYO: дверь — 7 дней бесплатно, путь 1 — бинокль, путь 2 — микроскоп" loading="lazy" decoding="async" width={1280} height={720} />
              <span className="smv-play" data-loading={state === 'loading' ? '1' : '0'}>
                <Play className="w-7 h-7" fill="currentColor" />
              </span>
              <span className="smv-time">4:35</span>
            </button>
          )}

          {state === 'ended' && (
            <div className="smv-end">
              <p className="smv-end-title">Начните с двери</p>
              <p className="smv-end-sub">7 дней весь терминал бесплатно, как у подписчиков</p>
              <a
                href={TELEGRAM_LINKS.trial}
                target="_blank"
                rel="noopener noreferrer"
                className="v3h-btn v3h-btn--solid"
                onClick={() => trackClick('map_video_trial')}
              >
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
