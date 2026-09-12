import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import VideoPlayer from './VideoPlayer';
import LikeButton from './LikeButton';
import ShareMenu from './ShareMenu';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { selectVideoById } from '../../store/videosSlice';
import { useVideoSlot } from '../../hooks/useVideoSlot';
import { useSlidesPerView } from '../../hooks/useBreakpoint';
import playbackManager, { modalKey } from '../../services/playbackManager';
import { clamp, placeholderThumbnail, sourceList } from '../../utils/format';
import './InnerCarousel.css';

const DRAG_COMMIT_RATIO = 0.18;

const DRAG_THRESHOLD_PX = 6;

function Slide({ videoId, index, isSelected, muted, onMutedChange, onSelect, left, width }) {
  const video = useSelector((state) => selectVideoById(state, videoId));
  // Scoped key: this slide's slot is distinct from the same video's rail tile.
  const slotKey = modalKey(videoId);
  const { isMounted, isActive } = useVideoSlot(slotKey);
  const [thumbFailed, setThumbFailed] = useState(false);

  const sources = useMemo(() => sourceList(video), [video]);
  const poster =
    thumbFailed || !video?.thumbnailUrl ? placeholderThumbnail(videoId) : video.thumbnailUrl;

  useEffect(() => {
    playbackManager.register(slotKey);
    playbackManager.setVisible(slotKey, true, 1);
    return () => playbackManager.unregister(slotKey);
  }, [slotKey]);

  const requestPlay = useCallback(() => playbackManager.play(slotKey), [slotKey]);
  const requestPause = useCallback(() => playbackManager.pause(slotKey), [slotKey]);
  const handleSelect = useCallback(() => onSelect(index), [index, onSelect]);

  if (!video) return null;

  return (
    <li
      className={`sa-slide ${isSelected ? 'is-selected' : ''}`}
      style={{ left, width }}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="sa-slide__frame">
        <img
          className="sa-slide__thumb"
          src={poster}
          onError={() => setThumbFailed(true)}
          alt=""
          decoding="async"
          draggable={false}
        />

        {isMounted && (
          <VideoPlayer
            sources={sources}
            poster={poster}
            title={video.title}
            isActive={isActive}
            muted={muted}
            onMutedChange={onMutedChange}
            onRequestPlay={requestPlay}
            onRequestPause={requestPause}
            variant="reel"
            loop
          />
        )}

   
        {!isSelected && (
          <div className="sa-slide__select" onClick={handleSelect} aria-hidden="true" />
        )}

        {isSelected && (
          <>
            <div className="sa-slide__rail">
              <LikeButton videoId={videoId} variant="rail" />
              <ShareMenu videoId={videoId} variant="rail" />
            </div>

            <div className="sa-slide__caption">
              <p className="sa-slide__creator">{video.creator}</p>
              <p className="sa-slide__title">{video.title}</p>
              <p className="sa-slide__desc">{video.description}</p>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function InnerCarousel({ videoIds, index, onIndexChange, muted, onMutedChange }) {
  const slidesPerView = useSlidesPerView();
  const total = videoIds.length;
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ pointerId: null, startX: 0, dx: 0, slideWidth: 1 });
  // Set as soon as a pointer travels far enough to count as a drag, so the
  // trailing click can be swallowed before it toggles playback or changes slide.
  const didDragRef = useRef(false);
  const start = index - Math.floor(slidesPerView / 2);

  const windowStart = Math.max(0, start - 1);
  const windowEnd = Math.min(total - 1, start + slidesPerView);

  const rendered = useMemo(
    () =>
      videoIds
        .slice(windowStart, windowEnd + 1)
        .map((id, offset) => ({ id, absoluteIndex: windowStart + offset })),
    [videoIds, windowStart, windowEnd]
  );

  const slideWidthPercent = 100 / slidesPerView;

  const goTo = useCallback(
    (next) => onIndexChange(clamp(next, 0, total - 1)),
    [onIndexChange, total]
  );

  const onPointerDown = useCallback(
    (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('button, a, [role="slider"], [data-no-drag]')) return;

      const viewport = viewportRef.current;
      if (!viewport) return;

      didDragRef.current = false;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        dx: 0,
        slideWidth: Math.max(1, viewport.clientWidth / slidesPerView),
        captured: false,
      };

    },
    [slidesPerView]
  );

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    drag.dx = event.clientX - drag.startX;

    if (!drag.captured && Math.abs(drag.dx) > DRAG_THRESHOLD_PX) {
   
      drag.captured = true;
      didDragRef.current = true;
      viewportRef.current?.setPointerCapture?.(event.pointerId);
      trackRef.current?.classList.add('is-dragging');
    }

    if (drag.captured) {
      trackRef.current?.style.setProperty('--sa-drag', `${drag.dx}px`);
    }
  }, []);

  const onClickCapture = useCallback((event) => {
    if (!didDragRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  }, []);

  const endDrag = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (drag.pointerId !== event.pointerId) return;

      const viewport = viewportRef.current;
      if (drag.captured && viewport?.hasPointerCapture?.(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      trackRef.current?.classList.remove('is-dragging');
      trackRef.current?.style.removeProperty('--sa-drag');

      const wasDrag = drag.captured;
      const raw = -drag.dx / drag.slideWidth;
      dragRef.current = { pointerId: null, startX: 0, dx: 0, slideWidth: 1, captured: false };

      if (!wasDrag || Math.abs(raw) < DRAG_COMMIT_RATIO) return;
      const steps = raw > 0 ? Math.max(1, Math.round(raw)) : Math.min(-1, Math.round(raw));
      goTo(index + steps);
    },
    [goTo, index]
  );

 
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const prevent = (event) => {
      if (dragRef.current.pointerId !== null) event.preventDefault();
    };
    viewport.addEventListener('touchmove', prevent, { passive: false });
    return () => viewport.removeEventListener('touchmove', prevent);
  }, []);

  return (
    <div className="sa-inner">
      <button
        type="button"
        className="sa-inner__arrow sa-inner__arrow--prev"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Previous video"
      >
        <ChevronLeftIcon width={22} height={22} />
      </button>

      <div
        ref={viewportRef}
        className="sa-inner__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <ul
          ref={trackRef}
          className="sa-inner__track"
          style={{ '--sa-shift': `${-start * slideWidthPercent}%` }}
        >
          {rendered.map(({ id, absoluteIndex }) => (
            <Slide
              key={id}
              videoId={id}
              index={absoluteIndex}
              isSelected={absoluteIndex === index}
              muted={muted}
              onMutedChange={onMutedChange}
              onSelect={goTo}
              left={`${absoluteIndex * slideWidthPercent}%`}
              width={`${slideWidthPercent}%`}
            />
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="sa-inner__arrow sa-inner__arrow--next"
        onClick={() => goTo(index + 1)}
        disabled={index >= total - 1}
        aria-label="Next video"
      >
        <ChevronRightIcon width={22} height={22} />
      </button>
    </div>
  );
}

export default memo(InnerCarousel);
