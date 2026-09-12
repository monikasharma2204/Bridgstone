import { useEffect, useRef } from 'react';


const pools = new Map();

function poolKey(options) {
  return `${options.rootMargin}|${options.threshold.join(',')}`;
}

function getPool(options) {
  const key = poolKey(options);
  let pool = pools.get(key);
  if (pool) return pool;

  const callbacks = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const fn = callbacks.get(entry.target);
        if (fn) fn(entry);
      });
    },
    { root: null, rootMargin: options.rootMargin, threshold: options.threshold }
  );

  pool = { observer, callbacks };
  pools.set(key, pool);
  return pool;
}

const DEFAULT_THRESHOLD = [0, 0.25, 0.5, 0.6, 0.75, 1];

export function useIntersectionObserver(ref, onChange, { rootMargin = '0px', threshold = DEFAULT_THRESHOLD } = {}) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

   
    if (typeof IntersectionObserver === 'undefined') {
      onChangeRef.current?.({ isIntersecting: true, intersectionRatio: 1 });
      return undefined;
    }

    const thresholds = thresholdKey.split(',').map(Number);
    const pool = getPool({ rootMargin, threshold: thresholds });

    pool.callbacks.set(element, (entry) => onChangeRef.current?.(entry));
    pool.observer.observe(element);

    return () => {
      pool.observer.unobserve(element);
      pool.callbacks.delete(element);
    };
  }, [ref, rootMargin, thresholdKey]);
}
