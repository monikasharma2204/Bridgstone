import { useEffect } from 'react';

const DRAG_THRESHOLD = 6;

export function useDragScroll(ref) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let pointerId = null;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = 0;

    const onPointerDown = (event) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
   
      if (event.target.closest('[data-no-drag]')) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = element.scrollLeft;
      moved = 0;
      element.classList.add('is-grabbing');
    };

    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      if (moved > DRAG_THRESHOLD) {
        // Only capture once we are sure this is a drag, so small jitters on a
        // click still reach the card.
        if (!element.hasPointerCapture(pointerId)) element.setPointerCapture(pointerId);
        element.scrollLeft = startScrollLeft - dx;
        event.preventDefault();
      }
    };

    const endDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
      pointerId = null;
      element.classList.remove('is-grabbing');
    };

    const onClickCapture = (event) => {
      if (moved > DRAG_THRESHOLD) {
        event.preventDefault();
        event.stopPropagation();
        moved = 0;
      }
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', endDrag);
    element.addEventListener('pointercancel', endDrag);
    element.addEventListener('click', onClickCapture, true);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', endDrag);
      element.removeEventListener('pointercancel', endDrag);
      element.removeEventListener('click', onClickCapture, true);
      element.classList.remove('is-grabbing');
    };
  }, [ref]);
}
