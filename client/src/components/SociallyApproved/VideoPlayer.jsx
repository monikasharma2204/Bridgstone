import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertIcon, MutedIcon, PauseIcon, PlayIcon, RefreshIcon, SoundIcon } from './Icons';
import { clamp, formatTime } from '../../utils/format';
import './VideoPlayer.css';


function VideoPlayer({
  sources,
  poster,
  title,
  isActive,
  muted,
  onMutedChange,
  onRequestPlay,
  onRequestPause,
  variant = 'card',
  loop = false,
}) {
  const videoRef = useRef(null);
  const fillRef = useRef(null);
  const timeRef = useRef(null);
  const trackRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [isPlaying, setIsPlaying] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);

  const candidates = useMemo(
    () => (Array.isArray(sources) ? sources.filter(Boolean) : []),
    [sources]
  );
  // Clamped, so the index can never point past the end of a shorter list.
  const src = candidates[Math.min(sourceIndex, Math.max(0, candidates.length - 1))];
  const hasMoreSources = sourceIndex < candidates.length - 1;

  const writeProgress = useCallback((ratio, currentTime, duration) => {
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${ratio})`;
    if (trackRef.current) {
      trackRef.current.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    }
    if (timeRef.current) {
      timeRef.current.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
  }, []);

 
  const wantsPlayRef = useRef(false);

  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.paused) return;

    const attempt = video.play();
    if (!attempt || typeof attempt.catch !== 'function') return;

    attempt.catch((err) => {
      if (err?.name === 'AbortError') return; 
      
      if (!video.muted) {
        video.muted = true;
        onMutedChange?.(true);
        video.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    });
  }, [onMutedChange]);

  // ---- attach / release the media source ---------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setStatus('loading');
    setIsPlaying(false);
    writeProgress(0, 0, 0);

    const handleCanPlay = () => {
      setStatus('ready');
      if (wantsPlayRef.current) attemptPlay();
    };
    const handleLoadedData = () => {
      if (wantsPlayRef.current) attemptPlay();
    };
    const handleWaiting = () => setStatus('loading');
    const handlePlaying = () => {
      setStatus('ready');
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      writeProgress(0, 0, video.duration);
    };
    const handleError = () => {
      setIsPlaying(false);
      // Try the next CDN before admitting defeat.
      if (hasMoreSources) setSourceIndex((current) => current + 1);
      else setStatus('error');
    };
    const handleTimeUpdate = () => {
      const duration = video.duration;
      const ratio = Number.isFinite(duration) && duration > 0 ? video.currentTime / duration : 0;
      writeProgress(clamp(ratio, 0, 1), video.currentTime, duration);
    };
    const handleLoadedMetadata = () => {
      writeProgress(0, 0, video.duration);

    
      if (!wantsPlayRef.current && video.currentTime === 0 && video.duration > 0.2) {
        try {
          video.currentTime = 0.05;
        } catch {
          /* not seekable yet - harmless, the poster just stays */
        }
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    video.src = src;
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);

      // Release the network connection and the decoded frames.
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, reloadKey, hasMoreSources, writeProgress, attemptPlay]);


  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);


  useEffect(() => {

    wantsPlayRef.current = isActive;

    const video = videoRef.current;
    if (!video || status === 'error') return;

    if (isActive) attemptPlay();
    else if (!video.paused) video.pause();
  }, [isActive, status, attemptPlay]);

  // ---- controls ----------------------------------------------------------
  const togglePlay = useCallback(
    (event) => {
      event.stopPropagation();
      if (isPlaying) onRequestPause?.();
      else onRequestPlay?.();
    },
    [isPlaying, onRequestPause, onRequestPlay]
  );

  const toggleMuted = useCallback(
    (event) => {
      event.stopPropagation();
      onMutedChange?.(!muted);
    },
    [muted, onMutedChange]
  );

  const retry = useCallback((event) => {
    event.stopPropagation();
    setSourceIndex(0);
    setReloadKey((key) => key + 1);
  }, []);

  const seekFromEvent = useCallback(
    (event) => {
      const video = videoRef.current;
      const track = trackRef.current;
      if (!video || !track || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      video.currentTime = ratio * video.duration;
      writeProgress(ratio, video.currentTime, video.duration);
    },
    [writeProgress]
  );

  const onTrackPointerDown = useCallback(
    (event) => {
      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      seekFromEvent(event);
    },
    [seekFromEvent]
  );

  const onTrackPointerMove = useCallback(
    (event) => {
      if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
      seekFromEvent(event);
    },
    [seekFromEvent]
  );

  const onTrackKeyDown = useCallback((event) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      video.currentTime = clamp(video.currentTime + 5, 0, video.duration);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      video.currentTime = clamp(video.currentTime - 5, 0, video.duration);
    }
  }, []);

  const isReel = variant === 'reel';
  const iconSize = isReel ? 20 : 15;

  return (
    <div
      className={`sa-player sa-player--${variant} ${isPlaying ? 'is-playing' : 'is-paused'}`}
      data-status={status}
    >
    
      {poster && (
        <div
          className="sa-player__backdrop"
          style={{ backgroundImage: `url("${poster}")` }}
          aria-hidden="true"
        />
      )}

      <video
        ref={videoRef}
        className="sa-player__video"
        poster={poster}
        preload="metadata"
        playsInline
        muted={muted}
        loop={loop}
        tabIndex={-1}
        aria-label={title}
      />

      {status === 'loading' && (
        <div className="sa-player__spinner" role="status" aria-live="polite">
          <span className="sa-spinner" />
          <span className="sa-visually-hidden">Loading video</span>
        </div>
      )}

      {status === 'error' && (
        <div className="sa-player__error" role="alert">
          <AlertIcon width={24} height={24} />
          <p>This clip could not be played.</p>
          <button type="button" className="sa-btn sa-btn--ghost" onClick={retry}>
            <RefreshIcon width={15} height={15} />
            Try again
          </button>
        </div>
      )}

      {status !== 'error' && (
        <div className="sa-player__chrome">
          {/* In the viewer, clicking anywhere on the frame toggles playback -
              not just the centre button. It is a plain div rather than a button
              so a horizontal swipe still reaches the carousel's drag handler;
              the carousel swallows the trailing click if the pointer moved.
              Keyboard users get the same action from the centre button below. */}
          {isReel && (
            <div className="sa-player__surface" onClick={togglePlay} aria-hidden="true" />
          )}

          <div
            ref={trackRef}
            className="sa-player__track"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            data-no-drag=""
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onKeyDown={onTrackKeyDown}
          >
            <span ref={fillRef} className="sa-player__fill" />
          </div>

          <button
            type="button"
            className="sa-player__mute"
            data-no-drag=""
            onClick={toggleMuted}
            aria-label={muted ? 'Unmute' : 'Mute'}
            aria-pressed={muted}
          >
            {muted ? (
              <MutedIcon width={iconSize} height={iconSize} />
            ) : (
              <SoundIcon width={iconSize} height={iconSize} />
            )}
          </button>

          <button
            type="button"
            className="sa-player__play"
            data-no-drag=""
            onClick={togglePlay}
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
          >
            {isPlaying ? (
              <PauseIcon width={isReel ? 26 : 18} height={isReel ? 26 : 18} />
            ) : (
              <PlayIcon width={isReel ? 26 : 18} height={isReel ? 26 : 18} />
            )}
          </button>

          {isReel && (
            <span ref={timeRef} className="sa-player__time">
              0:00 / 0:00
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(VideoPlayer);
