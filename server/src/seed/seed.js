'use strict';



const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const Video = require('../models/Video');
const Like = require('../models/Like');
const Share = require('../models/Share');

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'videos.json');
const MIN_COUNT = 30;
const MAX_COUNT = 40;

const fresh = process.argv.includes('--fresh') || process.argv.includes('-f');

function loadVideos() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `Missing data file: ${DATA_FILE}\nRun "npm run seed:generate" to rebuild it.`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    throw new Error(`${DATA_FILE} is not valid JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${DATA_FILE} must contain a JSON array of video objects.`);
  }

  const required = ['title', 'videoUrl'];
  parsed.forEach((video, index) => {
    const missing = required.filter((field) => !video[field]);
    if (missing.length) {
      throw new Error(`videos.json[${index}] is missing: ${missing.join(', ')}`);
    }
  });

  return parsed;
}

async function run() {
  const all = loadVideos();

  if (all.length < MIN_COUNT || all.length > MAX_COUNT) {
    console.warn(
      `[seed] videos.json holds ${all.length} records; the brief asks for ${MIN_COUNT}-${MAX_COUNT}.`
    );
  }

  // SEED_COUNT can insert a subset without editing the file.
  const count = Math.min(env.seedCount, all.length);
  const docs = all.slice(0, count).map((video, index) => ({
    likes: 0,
    shares: 0,
    order: index,
    ...video,
  }));

  await connectDB();

  if (fresh) {
    const [v, l, s] = await Promise.all([
      Video.deleteMany({}),
      Like.deleteMany({}),
      Share.deleteMany({}),
    ]);
    console.log(
      `[seed] cleared ${v.deletedCount} videos, ${l.deletedCount} likes, ${s.deletedCount} shares`
    );
  } else {
    const existing = await Video.countDocuments({});
    if (existing > 0) {
      console.log(
        `[seed] ${existing} video(s) already present. Run "npm run seed:fresh" to wipe and reseed.`
      );
      await disconnectDB();
      return;
    }
  }

  const inserted = await Video.insertMany(docs, { ordered: true });

  // Make sure the unique index behind duplicate-like prevention actually exists.
  await Promise.all([Like.syncIndexes(), Share.syncIndexes(), Video.syncIndexes()]);

  console.log(`[seed] read ${all.length} records from src/data/videos.json`);
  console.log(`[seed] inserted ${inserted.length} videos into "${mongoose.connection.name}"`);
  console.log(`[seed] first id: ${inserted[0]._id}`);
  console.log(`[seed] last  id: ${inserted[inserted.length - 1]._id}`);
  console.log('[seed] done. Start the API with: npm run dev');

  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  if (err.name === 'MongooseServerSelectionError') {
    console.error('[seed] is mongod running? check MONGODB_URI in server/.env');
  }
  try {
    await disconnectDB();
  } catch {
    /* already closed */
  }
  process.exit(1);
});
