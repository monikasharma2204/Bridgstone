

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatCount(value) {
  const n = Number(value) || 0;
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function placeholderThumbnail(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  const from = hash;
  const to = (hash + 48) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 64" preserveAspectRatio="none">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${from},42%,30%)"/>` +
    `<stop offset="1" stop-color="hsl(${to},38%,12%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="36" height="64" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function previewList(video) {
  const full = sourceList(video);
  if (!video?.previewUrl) return full;
  return [video.previewUrl, ...full.filter((url) => url !== video.previewUrl)];
}

/** Normalise a video record into an ordered list of playable sources. */
export function sourceList(video) {
  if (!video) return [];
  const list = Array.isArray(video.sources) ? video.sources.filter(Boolean) : [];
  if (video.videoUrl && !list.includes(video.videoUrl)) list.unshift(video.videoUrl);
  return list;
}
