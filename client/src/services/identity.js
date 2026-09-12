

const STORAGE_KEY = 'sac:userId';

function randomId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let cachedUserId = null;

export function getUserId() {
  if (cachedUserId) return cachedUserId;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedUserId = stored;
      return cachedUserId;
    }
  } catch {
    /* storage unavailable - fall back to an in-memory id for this session */
  }

  cachedUserId = randomId();

  try {
    window.localStorage.setItem(STORAGE_KEY, cachedUserId);
  } catch {
    /* ignore - the id still works for the lifetime of this page */
  }

  return cachedUserId;
}
