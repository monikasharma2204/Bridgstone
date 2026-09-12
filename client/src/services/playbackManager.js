


export const MAX_MOUNTED = 10;

export const MAX_PLAYING = 6;

const PLAY_RATIO = 0.5;

export const SCOPE_RAIL = 'rail';
export const SCOPE_MODAL = 'modal';

export const railKey = (videoId) => `${SCOPE_RAIL}:${videoId}`;
export const modalKey = (videoId) => `${SCOPE_MODAL}:${videoId}`;

const scopeOf = (key) => key.slice(0, key.indexOf(':'));
const videoIdOf = (key) => key.slice(key.indexOf(':') + 1);

export const STATE_MOUNTED = 1;
export const STATE_ACTIVE = 2;

function createPlaybackManager() {
 
  const registered = new Set();
  const ratios = new Map();
  
  let visibleOrder = [];
  const visible = new Set();


  const pausedKeys = new Set();
  const manualPlayKeys = new Set();

  let currentScope = SCOPE_RAIL;
  let mounted = new Set();
  let activeKeys = new Set();
  let modalActiveKey = null;
  let autoplayEnabled = true;


  const listeners = new Map();
  const globalListeners = new Set();

  let statsSnapshot = { mounted: 0, active: 0, scope: currentScope };

  function refreshStats() {
    const next = { mounted: mounted.size, active: activeKeys.size, scope: currentScope };
    if (
      next.mounted !== statsSnapshot.mounted ||
      next.active !== statsSnapshot.active ||
      next.scope !== statsSnapshot.scope
    ) {
      statsSnapshot = next;
    }
  }

  function notify(keys) {
    refreshStats();
    keys.forEach((key) => {
      const set = listeners.get(key);
      if (set) set.forEach((fn) => fn());
    });
    globalListeners.forEach((fn) => fn());
  }


  function pickActive(kept, viewerOpen) {
    if (viewerOpen) {
      const next = new Set();

      if (modalActiveKey && mounted.has(modalActiveKey)) {
        next.add(modalActiveKey);
     
        const twin = railKey(videoIdOf(modalActiveKey));
        if (mounted.has(twin)) next.add(twin);
      }
      return next;
    }

    const playable = kept.filter((key) => {
      if (pausedKeys.has(key)) return false; 
      if (manualPlayKeys.has(key)) return true; 
      if (!autoplayEnabled) return false;
      return (ratios.get(key) ?? 0) >= PLAY_RATIO; 
    });

    playable.sort((a, b) => (ratios.get(b) ?? 0) - (ratios.get(a) ?? 0));
    return new Set(playable.slice(0, MAX_PLAYING));
  }


  function recompute() {
    const previousMounted = mounted;
    const previousActive = activeKeys;

    const live = visibleOrder.filter((key) => registered.has(key));
    const slides = live.filter((key) => scopeOf(key) === SCOPE_MODAL);
    const tiles = live.filter((key) => scopeOf(key) === SCOPE_RAIL);

    const viewerOpen = slides.length > 0;

    let kept;
    if (viewerOpen) {

      const keptSlides = slides.slice(-MAX_MOUNTED);
      let room = MAX_MOUNTED - keptSlides.length;

      const twin = modalActiveKey ? railKey(videoIdOf(modalActiveKey)) : null;
      const twinKept = twin && tiles.includes(twin) ? [twin] : [];
      room -= twinKept.length;

      const otherTiles = room > 0 ? tiles.filter((key) => key !== twin).slice(-room) : [];
      kept = keptSlides.concat(twinKept, otherTiles);
    } else {
    
      kept = tiles.slice(-MAX_MOUNTED);
    }

    mounted = new Set(kept);

    activeKeys = pickActive(kept, viewerOpen);

    const changed = new Set();
    previousMounted.forEach((key) => {
      if (!mounted.has(key)) changed.add(key);
    });
    mounted.forEach((key) => {
      if (!previousMounted.has(key)) changed.add(key);
    });
    previousActive.forEach((key) => {
      if (!activeKeys.has(key)) changed.add(key);
    });
    activeKeys.forEach((key) => {
      if (!previousActive.has(key)) changed.add(key);
    });

    if (changed.size > 0) notify(changed);
    else refreshStats();
  }

  return {
    MAX_MOUNTED,
    MAX_PLAYING,

    /** Called once per video component mount, with a scoped key. */
    register(key) {
      registered.add(key);
      recompute();
    },

    unregister(key) {
      registered.delete(key);
      ratios.delete(key);
      pausedKeys.delete(key);
      manualPlayKeys.delete(key);
      if (visible.delete(key)) {
        visibleOrder = visibleOrder.filter((x) => x !== key);
      }
  
      recompute();
    },

    /** Fed by the IntersectionObserver on each card. */
    setVisible(key, isVisible, ratio = 0) {
      ratios.set(key, isVisible ? ratio : 0);

      if (isVisible && !visible.has(key)) {
        visible.add(key);
        visibleOrder.push(key);
      } else if (!isVisible && visible.has(key)) {
        visible.delete(key);
        visibleOrder = visibleOrder.filter((x) => x !== key);
      
        pausedKeys.delete(key);
        manualPlayKeys.delete(key);
      }

      recompute();
    },


    setScope(scope) {
      if (currentScope === scope) return;
      currentScope = scope;
      pausedKeys.clear();
      manualPlayKeys.clear();
      if (scope !== SCOPE_MODAL) modalActiveKey = null;
      recompute();
    },

    play(key) {
      if (scopeOf(key) === SCOPE_MODAL) {
        modalActiveKey = key;
      } else {
        pausedKeys.delete(key);
        manualPlayKeys.add(key);
      }
      recompute();
    },

  
    pause(key) {
      if (scopeOf(key) === SCOPE_MODAL) {
        if (modalActiveKey === key) modalActiveKey = null;
      } else {
        manualPlayKeys.delete(key);
        pausedKeys.add(key);
      }
      recompute();
    },


    setActive(key) {
      modalActiveKey = key;
      recompute();
    },

    setAutoplayEnabled(enabled) {
      if (autoplayEnabled === enabled) return;
      autoplayEnabled = enabled;
      if (!enabled) manualPlayKeys.clear();
      recompute();
    },

    
    getState(key) {
      return (mounted.has(key) ? STATE_MOUNTED : 0) | (activeKeys.has(key) ? STATE_ACTIVE : 0);
    },

    subscribeTo(key, listener) {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(key);
      };
    },

    
    subscribeAll(listener) {
      globalListeners.add(listener);
      return () => globalListeners.delete(listener);
    },

    getStats() {
      return statsSnapshot;
    },

   
    debug() {
      return {
        scope: currentScope,
        autoplayEnabled,
        modalActiveKey,
        registered: [...registered],
        visibleOrder: [...visibleOrder],
        mounted: [...mounted],
        active: [...activeKeys],
        paused: [...pausedKeys],
        manualPlay: [...manualPlayKeys],
        ratios: Object.fromEntries(ratios),
      };
    },
  };
}

const playbackManager = createPlaybackManager();

// Development-only console handle: `__playback.debug()`.
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.__playback = playbackManager;
}

export default playbackManager;
