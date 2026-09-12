import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import VideoPlayer from './VideoPlayer';
import { placeholderThumbnail, previewList } from '../../utils/format';
import { selectVideoById } from '../../store/videosSlice';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useVideoSlot } from '../../hooks/useVideoSlot';
import playbackManager, { railKey } from '../../services/playbackManager';


function VideoCard({ videoId, onOpen }) {
  const video = useSelector((state) => selectVideoById(state, videoId));
  const cardRef = useRef(null);
  // Scoped key: this tile's slot is distinct from the same video's viewer slide.
  const slotKey = railKey(videoId);
  const { isMounted, isActive } = useVideoSlot(slotKey);
  const [muted, setMuted] = useState(true);
  const [thumbFailed, setThumbFailed] = useState(false);

  // The rail plays the proxy rendition; the viewer plays the master. See
  // `previewList` for why.
  const sources = useMemo(() => previewList(video), [video]);
  // No poster on the record, or the image failed to load: draw a generated
  // gradient instead of a broken image.
  const poster =
    thumbFailed || !video?.thumbnailUrl ? placeholderThumbnail(videoId) : video.thumbnailUrl;

  useEffect(() => {
    playbackManager.register(slotKey);
    return () => playbackManager.unregister(slotKey);
  }, [slotKey]);

  const handleIntersect = useCallback(
    (entry) => {
      playbackManager.setVisible(slotKey, entry.isIntersecting, entry.intersectionRatio);
    },
    [slotKey]
  );

  useIntersectionObserver(cardRef, handleIntersect, { rootMargin: '80px 340px' });

  const handleOpen = useCallback(() => onOpen(videoId), [onOpen, videoId]);

  const requestPlay = useCallback(() => playbackManager.play(slotKey), [slotKey]);
  const requestPause = useCallback(() => playbackManager.pause(slotKey), [slotKey]);

  if (!video) return null;

  return (
    <article ref={cardRef} className={`sa-card ${isActive ? 'is-active' : ''}`}>
      <img
        className="sa-card__thumb"
        src={poster}
        onError={() => setThumbFailed(true)}
        alt=""
        loading="lazy"
        decoding="async"
        width={720}
        height={1280}
        draggable={false}
      />


      <button type="button" className="sa-card__open" onClick={handleOpen}>
        <span className="sa-visually-hidden">{`Open ${video.title}`}</span>
      </button>

      {isMounted && (
        <VideoPlayer
          sources={sources}
          poster={poster}
          title={video.title}
          isActive={isActive}
          muted={muted}
          onMutedChange={setMuted}
          onRequestPlay={requestPlay}
          onRequestPause={requestPause}
          variant="card"
          loop
        />
      )}
    </article>
  );
}

export default memo(VideoCard);
