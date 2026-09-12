import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import InnerCarousel from './InnerCarousel';
import { CloseIcon } from './Icons';
import { selectVideoById, selectVideoIds } from '../../store/videosSlice';
import { modalClosed, selectIsModalOpen, selectSelectedVideoId, selectedVideoChanged } from '../../store/uiSlice';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import playbackManager, { SCOPE_MODAL, SCOPE_RAIL, modalKey } from '../../services/playbackManager';
import { clamp } from '../../utils/format';
import './VideoModal.css';

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function VideoModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsModalOpen);
  const selectedId = useSelector(selectSelectedVideoId);
  const videoIds = useSelector(selectVideoIds);
  const selectedVideo = useSelector((state) => selectVideoById(state, selectedId));

  const [muted, setMuted] = useState(true);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const index = useMemo(() => {
    const found = videoIds.indexOf(selectedId);
    return found < 0 ? 0 : found;
  }, [videoIds, selectedId]);

  useBodyScrollLock(isOpen);

  const handleClose = useCallback(() => {
    dispatch(modalClosed());
  }, [dispatch]);

  const handleIndexChange = useCallback(
    (nextIndex) => {
      const safe = clamp(nextIndex, 0, videoIds.length - 1);
      const nextId = videoIds[safe];
      if (nextId && nextId !== selectedId) dispatch(selectedVideoChanged(nextId));
    },
    [dispatch, selectedId, videoIds]
  );

  // Opening the modal switches the playback scope, which instantly unmounts
  // every video in the rail behind it.
  useEffect(() => {
    if (!isOpen) return undefined;
    playbackManager.setScope(SCOPE_MODAL);
    return () => playbackManager.setScope(SCOPE_RAIL);
  }, [isOpen]);

  // The selected slide is the one - and the only one - that plays.
  useEffect(() => {
    if (!isOpen || !selectedId) return;
    playbackManager.setActive(modalKey(selectedId));
  }, [isOpen, selectedId]);

  // Move focus in on open, and put it back where it came from on close.
  useEffect(() => {
    if (!isOpen) return undefined;
    restoreFocusRef.current = document.activeElement;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(timer);
      const target = restoreFocusRef.current;
      if (target && typeof target.focus === 'function' && document.contains(target)) {
        target.focus();
      }
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  // Escape closes, arrows move, Tab is trapped inside the dialog.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleIndexChange(index + 1);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleIndexChange(index - 1);
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose, handleIndexChange, index, isOpen]);

  if (!isOpen || videoIds.length === 0) return null;

  return createPortal(
    <div
      className="sa-modal"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        className="sa-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={selectedVideo ? `${selectedVideo.title} - video ${index + 1} of ${videoIds.length}` : 'Video'}
      >
        <button
          ref={closeRef}
          type="button"
          className="sa-modal__close"
          onClick={handleClose}
          aria-label="Close video viewer"
        >
          <CloseIcon width={26} height={26} />
        </button>

        <InnerCarousel
          videoIds={videoIds}
          index={index}
          onIndexChange={handleIndexChange}
          muted={muted}
          onMutedChange={setMuted}
        />

        <footer className="sa-modal__footer">
          <p className="sa-modal__counter" aria-live="polite">
            {index + 1} / {videoIds.length}
          </p>
          <p className="sa-modal__hint">Swipe, drag or use the arrow keys · Esc to close</p>
        </footer>
      </div>
    </div>,
    document.body
  );
}
