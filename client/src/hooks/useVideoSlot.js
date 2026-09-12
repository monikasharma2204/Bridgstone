import { useCallback, useSyncExternalStore } from 'react';
import playbackManager, { STATE_ACTIVE, STATE_MOUNTED } from '../services/playbackManager';

export function useVideoSlot(slotKey) {
  const subscribe = useCallback(
    (listener) => playbackManager.subscribeTo(slotKey, listener),
    [slotKey]
  );
  const getSnapshot = useCallback(() => playbackManager.getState(slotKey), [slotKey]);
  const getServerSnapshot = useCallback(() => 0, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isMounted: (state & STATE_MOUNTED) !== 0,
    isActive: (state & STATE_ACTIVE) !== 0,
  };
}


export function usePlaybackStats() {
  const subscribe = useCallback((listener) => playbackManager.subscribeAll(listener), []);
  const getSnapshot = useCallback(() => playbackManager.getStats(), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
