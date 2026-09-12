import { useCallback, useSyncExternalStore } from 'react';


const DESKTOP_QUERY = '(min-width: 1024px)';
const TABLET_QUERY = '(min-width: 640px)';

function subscribe(listener) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const desktop = window.matchMedia(DESKTOP_QUERY);
  const tablet = window.matchMedia(TABLET_QUERY);
  desktop.addEventListener('change', listener);
  tablet.addEventListener('change', listener);
  return () => {
    desktop.removeEventListener('change', listener);
    tablet.removeEventListener('change', listener);
  };
}

function readSlidesPerView() {
  if (typeof window === 'undefined' || !window.matchMedia) return 3;
  if (window.matchMedia(DESKTOP_QUERY).matches) return 3;
  if (window.matchMedia(TABLET_QUERY).matches) return 2;
  return 1;
}

export function useSlidesPerView() {
  const getSnapshot = useCallback(() => readSlidesPerView(), []);
  const getServerSnapshot = useCallback(() => 3, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
