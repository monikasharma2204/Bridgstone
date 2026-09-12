import { useEffect } from 'react';

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const previousTouchAction = body.style.touchAction;

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    if (scrollbarWidth > 0) {
      const current = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      body.style.touchAction = previousTouchAction;
    };
  }, [active]);
}
