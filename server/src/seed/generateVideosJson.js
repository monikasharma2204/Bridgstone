'use strict';

const fs = require('fs');
const path = require('path');
const { buildSeedVideos, DEFAULT_COUNT } = require('./videoSeedData');

const OUT_DIR = path.resolve(__dirname, '..', 'data');
const OUT_FILE = path.join(OUT_DIR, 'videos.json');

const count = Number(process.argv[2]) || DEFAULT_COUNT;
const docs = buildSeedVideos(count);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(docs, null, 2)}\n`, 'utf8');

const hosts = new Set();
docs.forEach((doc) => doc.sources.forEach((url) => hosts.add(new URL(url).host)));

console.log(`[generate] wrote ${docs.length} records to src/data/videos.json`);
console.log(`[generate] hosts referenced: ${[...hosts].join(', ')}`);
console.log('[generate] now run: npm run seed:fresh');
