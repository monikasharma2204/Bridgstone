'use strict';


const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', 'src', 'data', 'videos.json');

function collectCandidates() {
  const videos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const seen = new Map();

  const add = (role, url) => {
    if (!url || seen.has(url)) return;
    seen.set(url, `${role} ${new URL(url).host}`);
  };

  videos.forEach((video) => {
    add('master ', video.videoUrl);
    add('proxy  ', video.previewUrl);
    (video.sources || []).forEach((url) => add('source ', url));
    add('poster ', video.thumbnailUrl);
  });

  return [...seen.entries()].map(([url, label]) => [label, url]);
}

const CANDIDATES = collectCandidates();

const TIMEOUT_MS = 12000;


async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1023', 'User-Agent': 'Mozilla/5.0 media-probe' },
      redirect: 'follow',
      signal: controller.signal,
    });

    const type = res.headers.get('content-type') || '?';
    // Drain just enough to confirm bytes actually arrive.
    const reader = res.body?.getReader();
    let bytes = 0;
    if (reader) {
      const { value } = await reader.read();
      bytes = value ? value.length : 0;
      await reader.cancel();
    }

   
    const range = res.headers.get('content-range') || '';
    const totalBytes = Number(range.split('/')[1]);
    const size = Number.isFinite(totalBytes)
      ? `${(totalBytes / 1024 / 1024).toFixed(1)}MB`.padStart(7)
      : '      ?';

    clearTimeout(timer);
    const ms = Date.now() - startedAt;
    const ok = res.status >= 200 && res.status < 300 && bytes > 0;
    return { ok, detail: `HTTP ${res.status} ${size} ${type.padEnd(12)} ${ms}ms` };
  } catch (err) {
    clearTimeout(timer);
    const ms = Date.now() - startedAt;
    const reason = err.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : err.message;
    return { ok: false, detail: `${reason}  (${ms}ms)` };
  }
}

async function main() {
  console.log('\nMedia reachability probe');
  console.log('Checking which sample-media hosts this network can actually reach.\n');

  const failures = [];
  const byHost = new Map();

  for (const [name, url] of CANDIDATES) {
    const { ok, detail } = await probe(url);
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${name.padEnd(26)} ${detail}`);

    const host = name.trim().split(' ').pop();
    const tally = byHost.get(host) || { ok: 0, fail: 0 };
    tally[ok ? 'ok' : 'fail'] += 1;
    byHost.set(host, tally);
    if (!ok) failures.push([name, url]);
  }

  console.log(`\n${'-'.repeat(64)}`);
  console.log(`Checked ${CANDIDATES.length} distinct URLs from src/data/videos.json`);
  byHost.forEach((tally, host) => {
    console.log(`  ${host.padEnd(24)} ${tally.ok} reachable, ${tally.fail} failed`);
  });

  if (failures.length === 0) {
    console.log('\nEvery URL in the dataset is reachable from this machine.');
  } else {
    console.log(`\n${failures.length} URL(s) failed:`);
    failures.forEach(([name, url]) => console.log(`  ${name}  ${url}`));
    console.log('\nEach failed clip still has fallbacks in its `sources` chain, so the');
    console.log('rail will not blank - but paste this output back and the pool in');
    console.log('src/seed/videoSeedData.js can be pointed somewhere this network allows.');
  }
  console.log(`${'-'.repeat(64)}\n`);
}

main();
