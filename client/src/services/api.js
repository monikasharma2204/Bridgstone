
import { getUserId } from './identity';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function timeoutSignal(externalSignal) {

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Request timed out')), TIMEOUT_MS);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    else externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
  }

  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const { signal: composed, clear } = timeoutSignal(signal);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: composed,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    clear();
    if (err?.name === 'AbortError') {
      throw new ApiError('The request was cancelled or timed out.', 0);
    }
    throw new ApiError('Could not reach the server. Is the API running?', 0);
  }
  clear();

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.error?.details
    );
  }

  return payload;
}

/** GET /api/videos */
export function fetchVideos({ limit = 40, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit), userId: getUserId() });
  return request(`/videos?${params.toString()}`, { signal }).then((payload) => {
    // Accept both the documented envelope and a bare array, so the client does
    // not break if the API shape is simplified later.
    const data = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(data)) {
      throw new ApiError('The API returned an unexpected shape for /videos.', 500);
    }
    return data;
  });
}

/** POST /api/like */
export function postLike({ videoId, action, signal }) {
  return request('/like', {
    method: 'POST',
    signal,
    body: { videoId, userId: getUserId(), ...(action ? { action } : {}) },
  }).then((payload) => payload?.data);
}

/** POST /api/share */
export function postShare({ videoId, platform, signal }) {
  return request('/share', {
    method: 'POST',
    signal,
    body: { videoId, platform, userId: getUserId() },
  }).then((payload) => payload?.data);
}
