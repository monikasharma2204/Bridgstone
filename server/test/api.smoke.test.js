'use strict';


const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const API = `${BASE_URL}/api`;
const TEST_USER = `test-user-${Date.now()}`;

let passed = 0;
let failed = 0;
const failures = [];

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function fail(name, message) {
  failed += 1;
  failures.push(`${name}: ${message}`);
  console.log(`  ✗ ${name}`);
  console.log(`      ${message}`);
}

async function test(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (err) {
    fail(name, err.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function call(method, path, body, { raw = false } = {}) {
  const init = { method, headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = raw ? body : JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, init);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

const REQUIRED_FIELDS = ['_id', 'title', 'description', 'videoUrl', 'thumbnailUrl', 'likes', 'shares'];
const MISSING_BUT_VALID_ID = '0'.repeat(24);

async function main() {
  console.log(`\nSocially Approved Video Carousel - API smoke test`);
  console.log(`Target: ${API}\n`);

  // --- health -------------------------------------------------------------
  console.log('health');
  let videos = [];

  await test('GET /api/health returns 200 and a connected database', async () => {
    const { status, json } = await call('GET', '/health');
    assertEqual(status, 200, 'status');
    assertEqual(json?.data?.db, 'connected', 'db state');
  });

  // --- videos -------------------------------------------------------------
  console.log('\nGET /api/videos');

  await test('returns 30-40 videos', async () => {
    const { status, json } = await call('GET', '/videos');
    assertEqual(status, 200, 'status');
    assert(Array.isArray(json?.data), 'response.data must be an array');
    videos = json.data;
    assert(
      videos.length >= 30 && videos.length <= 40,
      `expected 30-40 videos, got ${videos.length}`
    );
  });

  await test('every video carries the required metadata fields', async () => {
    assert(videos.length > 0, 'no videos fetched - is the database seeded?');
    for (const video of videos) {
      for (const field of REQUIRED_FIELDS) {
        assert(
          Object.prototype.hasOwnProperty.call(video, field),
          `video ${video._id} is missing "${field}"`
        );
      }
      assert(typeof video.likes === 'number', `likes must be a number on ${video._id}`);
      assert(typeof video.shares === 'number', `shares must be a number on ${video._id}`);
      assert(/^https?:\/\//.test(video.videoUrl), `videoUrl must be absolute on ${video._id}`);
      // thumbnailUrl is optional; when present it must still be a real URL.
      assert(
        !video.thumbnailUrl || /^https?:\/\//.test(video.thumbnailUrl),
        `thumbnailUrl must be absolute when set, on ${video._id}`
      );
    }
  });

  await test('no duplicate ids', async () => {
    const ids = new Set(videos.map((v) => v._id));
    assertEqual(ids.size, videos.length, 'unique id count');
  });

  await test('?limit=5 returns exactly 5', async () => {
    const { status, json } = await call('GET', '/videos?limit=5');
    assertEqual(status, 200, 'status');
    assertEqual(json.data.length, 5, 'length');
  });

  await test('?limit=abc returns 400', async () => {
    const { status, json } = await call('GET', '/videos?limit=abc');
    assertEqual(status, 400, 'status');
    assertEqual(json?.success, false, 'success flag');
  });

  await test('?limit=0 returns 400', async () => {
    const { status } = await call('GET', '/videos?limit=0');
    assertEqual(status, 400, 'status');
  });

  console.log('\nGET /api/videos/:id');

  await test('valid id returns the video', async () => {
    const { status, json } = await call('GET', `/videos/${videos[0]._id}`);
    assertEqual(status, 200, 'status');
    assertEqual(json.data._id, videos[0]._id, 'id');
  });

  await test('malformed id returns 400', async () => {
    const { status } = await call('GET', '/videos/not-an-object-id');
    assertEqual(status, 400, 'status');
  });

  await test('well-formed but missing id returns 404', async () => {
    const { status } = await call('GET', `/videos/${MISSING_BUT_VALID_ID}`);
    assertEqual(status, 404, 'status');
  });

  // --- like ---------------------------------------------------------------
  console.log('\nPOST /api/like');
  const target = videos[0];
  const baselineLikes = target.likes;

  await test('empty body returns 400', async () => {
    const { status } = await call('POST', '/like', {});
    assertEqual(status, 400, 'status');
  });

  await test('malformed videoId returns 400', async () => {
    const { status } = await call('POST', '/like', { videoId: 'nope', userId: TEST_USER });
    assertEqual(status, 400, 'status');
  });

  await test('unknown videoId returns 404', async () => {
    const { status } = await call('POST', '/like', {
      videoId: MISSING_BUT_VALID_ID,
      userId: TEST_USER,
    });
    assertEqual(status, 404, 'status');
  });

  await test('invalid action returns 400', async () => {
    const { status } = await call('POST', '/like', {
      videoId: target._id,
      userId: TEST_USER,
      action: 'smash',
    });
    assertEqual(status, 400, 'status');
  });

  await test('liking increments the counter by exactly 1', async () => {
    const { status, json } = await call('POST', '/like', {
      videoId: target._id,
      userId: TEST_USER,
      action: 'like',
    });
    assertEqual(status, 200, 'status');
    assertEqual(json.data.liked, true, 'liked');
    assertEqual(json.data.likes, baselineLikes + 1, 'likes');
  });

  await test('liking twice does NOT double count (duplicate prevention)', async () => {
    const { status, json } = await call('POST', '/like', {
      videoId: target._id,
      userId: TEST_USER,
      action: 'like',
    });
    assertEqual(status, 200, 'status');
    assertEqual(json.data.liked, true, 'liked');
    assertEqual(json.data.likes, baselineLikes + 1, 'likes (unchanged)');
    assertEqual(json.data.changed, false, 'changed flag');
  });

  await test('a different user can like the same video', async () => {
    const { status, json } = await call('POST', '/like', {
      videoId: target._id,
      userId: `${TEST_USER}-other`,
      action: 'like',
    });
    assertEqual(status, 200, 'status');
    assertEqual(json.data.likes, baselineLikes + 2, 'likes');
  });

  await test('the new count is persisted in MongoDB', async () => {
    const { json } = await call('GET', `/videos/${target._id}`);
    assertEqual(json.data.likes, baselineLikes + 2, 'persisted likes');
  });

  await test('likedByMe is reported for a known user', async () => {
    const { json } = await call('GET', `/videos?limit=1&userId=${encodeURIComponent(TEST_USER)}`);
    assertEqual(json.data[0].likedByMe, true, 'likedByMe');
  });

  await test('unliking decrements back', async () => {
    const a = await call('POST', '/like', { videoId: target._id, userId: TEST_USER, action: 'unlike' });
    const b = await call('POST', '/like', {
      videoId: target._id,
      userId: `${TEST_USER}-other`,
      action: 'unlike',
    });
    assertEqual(a.status, 200, 'status a');
    assertEqual(b.json.data.likes, baselineLikes, 'likes back to baseline');
    assertEqual(b.json.data.liked, false, 'liked');
  });

  await test('toggle mode (no action field) flips the state', async () => {
    const on = await call('POST', '/like', { videoId: target._id, userId: TEST_USER });
    assertEqual(on.json.data.liked, true, 'toggled on');
    const off = await call('POST', '/like', { videoId: target._id, userId: TEST_USER });
    assertEqual(off.json.data.liked, false, 'toggled off');
    assertEqual(off.json.data.likes, baselineLikes, 'likes back to baseline');
  });

  // --- share --------------------------------------------------------------
  console.log('\nPOST /api/share');
  const shareTarget = videos[1];
  const baselineShares = shareTarget.shares;

  await test('missing platform returns 400', async () => {
    const { status } = await call('POST', '/share', { videoId: shareTarget._id });
    assertEqual(status, 400, 'status');
  });

  await test('unsupported platform returns 400', async () => {
    const { status } = await call('POST', '/share', {
      videoId: shareTarget._id,
      platform: 'myspace',
    });
    assertEqual(status, 400, 'status');
  });

  await test('missing videoId returns 400', async () => {
    const { status } = await call('POST', '/share', { platform: 'copy' });
    assertEqual(status, 400, 'status');
  });

  await test('unknown videoId returns 404', async () => {
    const { status } = await call('POST', '/share', {
      videoId: MISSING_BUT_VALID_ID,
      platform: 'copy',
    });
    assertEqual(status, 404, 'status');
  });

  await test('a valid share returns 201 and increments the counter', async () => {
    const { status, json } = await call('POST', '/share', {
      videoId: shareTarget._id,
      platform: 'copy',
      userId: TEST_USER,
    });
    assertEqual(status, 201, 'status');
    assertEqual(json.data.shares, baselineShares + 1, 'shares');
  });

  await test('every supported platform is accepted', async () => {
    const platforms = ['whatsapp', 'facebook', 'x', 'native', 'other'];
    for (let i = 0; i < platforms.length; i += 1) {
      const { status, json } = await call('POST', '/share', {
        videoId: shareTarget._id,
        platform: platforms[i],
        userId: TEST_USER,
      });
      assertEqual(status, 201, `status for ${platforms[i]}`);
      assertEqual(json.data.shares, baselineShares + 2 + i, `shares after ${platforms[i]}`);
    }
  });

  await test('share count is persisted in MongoDB', async () => {
    const { json } = await call('GET', `/videos/${shareTarget._id}`);
    assertEqual(json.data.shares, baselineShares + 6, 'persisted shares');
  });

  // --- generic error handling --------------------------------------------
  console.log('\nerror handling');

  await test('unknown route returns 404 JSON', async () => {
    const { status, json } = await call('GET', '/does-not-exist');
    assertEqual(status, 404, 'status');
    assertEqual(json?.success, false, 'success flag');
  });

  await test('malformed JSON body returns 400', async () => {
    const { status, json } = await call('POST', '/like', '{ not json', { raw: true });
    assertEqual(status, 400, 'status');
    assertEqual(json?.success, false, 'success flag');
  });

  await test('non-object JSON body returns 400', async () => {
    const { status } = await call('POST', '/like', [1, 2, 3]);
    assertEqual(status, 400, 'status');
  });

  await test('wrong method on /api/videos returns 404', async () => {
    const { status } = await call('POST', '/videos', {});
    assertEqual(status, 404, 'status');
  });

  // --- summary ------------------------------------------------------------
  console.log(`\n${'-'.repeat(52)}`);
  console.log(`passed: ${passed}   failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  } else {
    console.log('All API checks passed.');
  }
  console.log(`${'-'.repeat(52)}\n`);
}

main().catch((err) => {
  console.error('\nSmoke test could not run:', err.message);
  console.error('Is the server running at ' + BASE_URL + ' and the database seeded?');
  process.exitCode = 1;
});
