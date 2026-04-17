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
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0].split('?')[0];
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      if (u.searchParams.has('v')) return u.searchParams.get('v');
      const live = u.pathname.match(/^\/live\/([^/?]+)/);
      if (live) return live[1];
      const embed = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {}
  return null;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface Props {
  url: string;
  watermark?: React.ReactNode;
}

export default function YouTubePlayer({ url, watermark }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const savedPositionRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fakeFullscreen, setFakeFullscreen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const videoId = extractVideoId(url);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    hideTimerRef.current = setTimeout(() => {
      if (playerRef.current?.getPlayerState?.() === 1) setControlsVisible(false);
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState();
    if (state === 1) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
    scheduleHide();
  }, [scheduleHide]);

  const updateProgress = useCallback(() => {
    const p = playerRef.current;
    if (p?.getCurrentTime) {
      const t = p.getCurrentTime();
      setCurrentTime(t);
      savedPositionRef.current = t;
      const d = p.getDuration();
      if (d > 0) setDuration(d);
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  // Save position every 5 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime) {
        savedPositionRef.current = p.getCurrentTime();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Exit fake fullscreen on Escape key
  useEffect(() => {
    if (!fakeFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFakeFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fakeFullscreen]);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.inset = '0';
    el.style.width = '100%';
    el.style.height = '100%';
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
          onReady: () => {
            const iframe = player.getIframe?.();
            if (iframe instanceof HTMLIFrameElement) {
              iframe.style.position = 'absolute';
              iframe.style.inset = '0';
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = '0';
              iframe.style.pointerEvents = 'none';
              iframe.setAttribute('allowfullscreen', 'true');
              iframe.setAttribute('webkitallowfullscreen', 'true');
              iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
            }
            const d = player.getDuration();
            if (d > 0) setDuration(d);
            // Resume from saved position if player was reinitialized
            if (savedPositionRef.current > 1) {
              player.seekTo(savedPositionRef.current, true);
            }
          },
          onStateChange: (e: any) => {
            const isPlaying = e.data === 1;
            setPlaying(isPlaying);
            if (isPlaying) {
              setStarted(true);
              rafRef.current = requestAnimationFrame(updateProgress);
              scheduleHide();
            } else {
              cancelAnimationFrame(rafRef.current);
              setControlsVisible(true);
            }
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(hideTimerRef.current);
      player?.destroy?.();
      playerRef.current = null;
      setPlaying(false);
      setStarted(false);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [videoId, updateProgress, scheduleHide]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    p.seekTo(ratio * duration, true);
    setCurrentTime(ratio * duration);
    scheduleHide();
  }, [duration, scheduleHide]);

  const changeSpeed = useCallback((s: number) => {
    const p = playerRef.current;
    if (p?.setPlaybackRate) p.setPlaybackRate(s);
    setSpeed(s);
    setShowSpeed(false);
    scheduleHide();
  }, [scheduleHide]);

  const changeVolume = useCallback((v: number) => {
    const p = playerRef.current;
    const clamped = Math.max(0, Math.min(100, v));
    if (p?.setVolume) p.setVolume(clamped);
    if (clamped > 0 && muted && p?.unMute) {
      p.unMute();
      setMuted(false);
    }
    setVolume(clamped);
    scheduleHide();
  }, [scheduleHide, muted]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute?.();
      setMuted(false);
    } else {
      p.mute?.();
      setMuted(true);
    }
    scheduleHide();
  }, [muted, scheduleHide]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Check if currently in native fullscreen
    const inNativeFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    
    if (inNativeFS) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      return;
    }

    if (fakeFullscreen) {
      setFakeFullscreen(false);
      scheduleHide();
      return;
    }

    // Try native fullscreen first
    const tryNative = el.requestFullscreen
      ? el.requestFullscreen()
      : (el as any).webkitRequestFullscreen
        ? Promise.resolve((el as any).webkitRequestFullscreen())
        : Promise.reject();

    tryNative.catch(() => {
      // Native fullscreen failed (iOS Safari) — use fake fullscreen
      setFakeFullscreen(true);
    });

    scheduleHide();
  }, [scheduleHide, fakeFullscreen]);

  if (!videoId) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showControls = controlsVisible || !playing;

  const containerStyle: React.CSSProperties = fakeFullscreen
    ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: '#000', borderRadius: 0 }
    : { position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#111' };

  return (
    <div
      ref={containerRef}
      className={fakeFullscreen ? 'overflow-hidden' : 'rounded-xl overflow-hidden'}
      style={containerStyle}
      onMouseMove={scheduleHide}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        togglePlay();
      }}
    >
      {/* Full overlay to block YouTube native UI */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 10, cursor: showControls ? 'default' : 'none',
      }} />

      {/* Center play/pause */}
      {!playing && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 20, width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          aria-label="Play"
        >
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
            <path d="M2 1.5L20 13L2 24.5V1.5Z" fill="#fff" />
          </svg>
        </button>
      )}

      {/* Bottom control bar */}
      {started && (
        <div
          data-controls
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 20,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '24px 12px 8px', transition: 'opacity 0.3s',
            opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none',
          }}
        >
          {/* Progress bar */}
          <div
            onClick={seek}
            style={{
              width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px', cursor: 'pointer', marginBottom: '8px', position: 'relative',
            }}
          >
            <div style={{
              width: `${progress}%`, height: '100%', backgroundColor: '#fff',
              borderRadius: '2px',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)',
              width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fff',
            }} />
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
              {playing ? (
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                  <rect x="1" y="1" width="4" height="16" rx="1" fill="#fff" />
                  <rect x="11" y="1" width="4" height="16" rx="1" fill="#fff" />
                </svg>
              ) : (
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
                  <path d="M1 1L15 9L1 17V1Z" fill="#fff" />
                </svg>
              )}
            </button>

            {/* Time */}
            <span style={{ fontSize: '12px', color: '#fff', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Volume */}
            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button
                onClick={toggleMute}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="#fff" />
                    <path d="M22 9l-6 6M16 9l6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : volume < 50 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="#fff" />
                    <path d="M15.5 8.5a5 5 0 010 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="#fff" />
                    <path d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <div
                style={{
                  width: showVolume ? '70px' : '0px',
                  overflow: 'hidden',
                  transition: 'width 0.2s',
                  marginLeft: showVolume ? '6px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  style={{
                    width: '70px',
                    height: '4px',
                    accentColor: '#fff',
                    cursor: 'pointer',
                  }}
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Speed */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSpeed(!showSpeed)}
                style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px',
                  color: '#fff', fontSize: '11px', padding: '2px 6px', cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {speed}x
              </button>
              {showSpeed && (
                <div style={{
                  position: 'absolute', bottom: '28px', right: 0, backgroundColor: 'rgba(0,0,0,0.9)',
                  borderRadius: '6px', padding: '4px 0', minWidth: '60px',
                }}>
                  {SPEEDS.map(s => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      style={{
                        display: 'block', width: '100%', padding: '4px 12px', border: 'none',
                        background: s === speed ? 'rgba(255,255,255,0.15)' : 'none',
                        color: '#fff', fontSize: '12px', cursor: 'pointer', textAlign: 'left',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
              {fakeFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6 2v4H2M12 2v4h4M16 16h-4v-4M2 16h4v-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Watermark inside fullscreen container */}
      {watermark}
    </div>
  );
}
