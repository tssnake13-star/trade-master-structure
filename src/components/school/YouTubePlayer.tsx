import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYTApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiLoadPromise;
}

function extractVideoId(raw: string): string | null {
  try {
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      if (u.searchParams.has('v')) return u.searchParams.get('v');
      const live = u.pathname.match(/^\/live\/([^/?]+)/);
      if (live) return live[1];
      const embed = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) return embed[1];
    }
  } catch {}
  return null;
}

interface Props {
  url: string;
}

export default function YouTubePlayer({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const videoId = extractVideoId(url);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState();
    if (state === 1) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, []);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const el = document.createElement('div');
    containerRef.current.prepend(el);

    let player: any;

    loadYTApi().then(() => {
      if (!containerRef.current) return;
      player = new window.YT.Player(el, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          controls: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: any) => {
            setPlaying(e.data === 1);
            if (e.data === 1) setStarted(true);
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      player?.destroy?.();
      playerRef.current = null;
      setPlaying(false);
      setStarted(false);
    };
  }, [videoId]);

  if (!videoId) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '514px',
        aspectRatio: '16/9',
        backgroundColor: '#111',
      }}
    >
      {/* Overlay blocks all YouTube native UI */}
      <div
        onClick={togglePlay}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          cursor: 'pointer',
        }}
      />

      {/* Play/Pause button */}
      {!playing && (
        <button
          onClick={togglePlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(232,224,208,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          aria-label={started ? 'Play' : 'Play video'}
        >
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
            <path d="M2 1.5L20 13L2 24.5V1.5Z" fill="#e8e0d0" />
          </svg>
        </button>
      )}
    </div>
  );
}
