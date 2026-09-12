import { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HeartIcon } from './Icons';
import { selectIsLiked, selectVideoById, toggleLike } from '../../store/videosSlice';
import { toastShown } from '../../store/uiSlice';
import { formatCount } from '../../utils/format';
import './Actions.css';

function LikeButton({ videoId, variant = 'rail' }) {
  const dispatch = useDispatch();
  const likes = useSelector((state) => selectVideoById(state, videoId)?.likes ?? 0);
  const liked = useSelector((state) => selectIsLiked(state, videoId));

  const onClick = useCallback(
    (event) => {
      event.stopPropagation();
      dispatch(toggleLike(videoId))
        .unwrap()
        .catch((message) => {
          dispatch(toastShown(message || 'Could not save your like.', 'error'));
        });
    },
    [dispatch, videoId]
  );

  const size = variant === 'rail' ? 28 : 17;

  return (
    <button
      type="button"
      className={`sa-action sa-action--${variant} sa-action--like ${liked ? 'is-liked' : ''}`}
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? 'Remove like' : 'Like this video'}
      data-no-drag=""
    >
      <HeartIcon filled={liked} width={size} height={size} />
      <span className="sa-action__count">{formatCount(likes)}</span>
    </button>
  );
}

export default memo(LikeButton);
