import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FacebookIcon, LinkIcon, SendIcon, ShareIcon, WhatsAppIcon, XIcon } from './Icons';
import { selectVideoById, shareVideo } from '../../store/videosSlice';
import { toastShown } from '../../store/uiSlice';
import { formatCount } from '../../utils/format';
import './Actions.css';
import './ShareMenu.css';

function buildShareUrl(videoId) {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('v', videoId);
  url.hash = '';
  return url.toString();
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

function ShareMenu({ videoId, variant = 'rail' }) {
  const dispatch = useDispatch();
  const menuId = useId();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);

  const video = useSelector((state) => selectVideoById(state, videoId));
  const shares = video?.shares ?? 0;
  const title = video?.title ?? 'Socially Approved';

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const track = useCallback(
    (platform) => {
      dispatch(shareVideo({ videoId, platform }))
        .unwrap()
        .catch((message) => dispatch(toastShown(message || 'Could not record the share.', 'error')));
    },
    [dispatch, videoId]
  );

  const onCopy = useCallback(
    async (event) => {
      event.stopPropagation();
      const ok = await copyToClipboard(buildShareUrl(videoId));
      dispatch(
        toastShown(ok ? 'Link copied to clipboard' : 'Could not copy the link', ok ? 'success' : 'error')
      );
      if (ok) track('copy');
      setOpen(false);
    },
    [dispatch, track, videoId]
  );

  const onNativeShare = useCallback(
    async (event) => {
      event.stopPropagation();
      const url = buildShareUrl(videoId);
      try {
        await navigator.share({ title, text: title, url });
        track('native');
      } catch (err) {
    
        if (err?.name !== 'AbortError') {
          dispatch(toastShown('Sharing was not completed.', 'error'));
        }
      }
      setOpen(false);
    },
    [dispatch, title, track, videoId]
  );

  const onExternal = useCallback(
    (event, platform) => {
      event.stopPropagation();
      const url = buildShareUrl(videoId);
      const text = encodeURIComponent(`${title} - `);
      const encoded = encodeURIComponent(url);

      const targets = {
        whatsapp: `https://api.whatsapp.com/send?text=${text}${encoded}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
        x: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`,
      };

      window.open(targets[platform], '_blank', 'noopener,noreferrer,width=620,height=560');
      track(platform);
      setOpen(false);
    },
    [title, track, videoId]
  );

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const size = variant === 'rail' ? 26 : 17;

  return (
    <div className={`sa-share sa-share--${variant}`} ref={wrapperRef} data-no-drag="">
      <button
        type="button"
        className={`sa-action sa-action--${variant} sa-action--share`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Share this video"
      >
        {variant === 'rail' ? (
          <SendIcon width={size} height={size} />
        ) : (
          <ShareIcon width={size} height={size} />
        )}
        <span className="sa-action__count">{formatCount(shares)}</span>
      </button>

      {open && (
        <div className="sa-share__menu" id={menuId} role="menu">
          {canNativeShare && (
            <button type="button" role="menuitem" className="sa-share__item" onClick={onNativeShare}>
              <ShareIcon width={16} height={16} />
              Share...
            </button>
          )}
          <button type="button" role="menuitem" className="sa-share__item" onClick={onCopy}>
            <LinkIcon width={16} height={16} />
            Copy link
          </button>
          <button
            type="button"
            role="menuitem"
            className="sa-share__item"
            onClick={(event) => onExternal(event, 'whatsapp')}
          >
            <WhatsAppIcon width={16} height={16} />
            WhatsApp
          </button>
          <button
            type="button"
            role="menuitem"
            className="sa-share__item"
            onClick={(event) => onExternal(event, 'facebook')}
          >
            <FacebookIcon width={16} height={16} />
            Facebook
          </button>
          <button
            type="button"
            role="menuitem"
            className="sa-share__item"
            onClick={(event) => onExternal(event, 'x')}
          >
            <XIcon width={16} height={16} />
            X
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ShareMenu);
