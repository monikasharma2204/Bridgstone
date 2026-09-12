import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OuterCarousel from './OuterCarousel';
import VideoModal from './VideoModal';
import Toast from './Toast';
import { AlertIcon, RefreshIcon } from './Icons';
import {
  loadVideos,
  selectVideoIds,
  selectVideosError,
  selectVideosStatus,
} from '../../store/videosSlice';
import {
  autoplayToggled,
  modalOpened,
  selectAutoplayPreviews,
} from '../../store/uiSlice';
import { usePlaybackStats } from '../../hooks/useVideoSlot';
import playbackManager, { MAX_MOUNTED, MAX_PLAYING } from '../../services/playbackManager';
import './SociallyApproved.css';

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'];

export default function SociallyApproved() {
  const dispatch = useDispatch();
  const videoIds = useSelector(selectVideoIds);
  const status = useSelector(selectVideosStatus);
  const error = useSelector(selectVideosError);
  const autoplay = useSelector(selectAutoplayPreviews);
  const stats = usePlaybackStats();
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    const promise = dispatch(loadVideos());
    return () => promise.abort();
  }, [dispatch]);

  useEffect(() => {
    playbackManager.setAutoplayEnabled(autoplay);
  }, [autoplay]);

  const handleOpen = useCallback(
    (videoId) => {
      dispatch(modalOpened(videoId));
    },
    [dispatch]
  );

  
  useEffect(() => {
    if (deepLinkHandled.current || status !== 'succeeded' || videoIds.length === 0) return;
    deepLinkHandled.current = true;
    const requested = new URLSearchParams(window.location.search).get('v');
    if (requested && videoIds.includes(requested)) dispatch(modalOpened(requested));
  }, [dispatch, status, videoIds]);

  return (
    <section className="sa" aria-labelledby="sa-heading">
      <header className="sa__header">
        <p className="sa__eyebrow">Straight from the community</p>
        <h2 className="sa__heading" id="sa-heading">
          Socially Approved
        </h2>
        <p className="sa__sub">
          {status === 'succeeded'
            ? `${videoIds.length} unfiltered clips from people who actually bought it.`
            : 'Real clips from people who actually bought it.'}
        </p>

        <div className="sa__tools">
          <label className="sa__switch">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(event) => dispatch(autoplayToggled(event.target.checked))}
            />
            <span className="sa__switch-track" aria-hidden="true">
              <span className="sa__switch-thumb" />
            </span>
            <span className="sa__switch-label">Autoplay previews</span>
          </label>

          <p
            className="sa__stats"
            title={`Hard caps: ${MAX_MOUNTED} video elements loaded, ${MAX_PLAYING} playing at once`}
          >
            <span>
              <strong>{stats.mounted}</strong>/{MAX_MOUNTED} loaded
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong>{stats.active}</strong>/{MAX_PLAYING} playing
            </span>
          </p>
        </div>
      </header>

      {status === 'loading' && (
        <div className="sa__skeletons" aria-hidden="true">
          {SKELETON_KEYS.map((key) => (
            <div className="sa__skeleton" key={key} />
          ))}
        </div>
      )}

      {status === 'loading' && (
        <p className="sa-visually-hidden" role="status">
          Loading videos
        </p>
      )}

      {status === 'failed' && (
        <div className="sa__error" role="alert">
          <AlertIcon width={26} height={26} />
          <div>
            <p className="sa__error-title">We could not load the videos.</p>
            <p className="sa__error-detail">{error}</p>
          </div>
          <button type="button" className="sa-btn" onClick={() => dispatch(loadVideos())}>
            <RefreshIcon width={16} height={16} />
            Retry
          </button>
        </div>
      )}

      {status === 'succeeded' && videoIds.length === 0 && (
        <p className="sa__empty">No videos yet. Run the seed script on the API and refresh.</p>
      )}

      {status === 'succeeded' && videoIds.length > 0 && (
        <OuterCarousel videoIds={videoIds} onOpen={handleOpen} />
      )}

      <VideoModal />
      <Toast />
    </section>
  );
}
