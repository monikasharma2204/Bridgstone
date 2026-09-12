

import playbackManager, {
  MAX_MOUNTED,
  MAX_PLAYING,
  SCOPE_MODAL,
  SCOPE_RAIL,
  STATE_ACTIVE,
  STATE_MOUNTED,
  modalKey,
  railKey,
} from './playbackManager.js';

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const isMounted = (key) => (playbackManager.getState(key) & STATE_MOUNTED) !== 0;
const isActive = (key) => (playbackManager.getState(key) & STATE_ACTIVE) !== 0;

function reset(keys) {
  keys.forEach((key) => playbackManager.unregister(key));
  playbackManager.setScope(SCOPE_RAIL);
  playbackManager.setAutoplayEnabled(true);
}

console.log('\nplaybackManager\n');

// ---------------------------------------------------------------------------
console.log('rail');

const railIds = ['v1', 'v2', 'v3', 'v4', 'v5'];
const railKeys = railIds.map(railKey);

check('five visible tiles all mount and all play', () => {
  railKeys.forEach((key) => playbackManager.register(key));
  railKeys.forEach((key) => playbackManager.setVisible(key, true, 1));

  railKeys.forEach((key) => {
    assert(isMounted(key), `${key} should be mounted`);
    assert(isActive(key), `${key} should be playing`);
  });
  assert(playbackManager.getStats().active === 5, 'five should be playing');
});

check('a tile below the visibility gate mounts but does not play', () => {
  playbackManager.setVisible(railKeys[4], true, 0.2);
  assert(isMounted(railKeys[4]), 'still mounted - it is in the band');
  assert(!isActive(railKeys[4]), 'but not playing - only 20% visible');
  playbackManager.setVisible(railKeys[4], true, 1);
});

check('explicit pause survives a recompute', () => {
  playbackManager.pause(railKeys[0]);
  assert(!isActive(railKeys[0]), 'paused tile must not play');
  playbackManager.setVisible(railKeys[1], true, 0.9); // force a recompute
  assert(!isActive(railKeys[0]), 'still paused after an unrelated change');
  playbackManager.play(railKeys[0]);
  assert(isActive(railKeys[0]), 'plays again once asked');
});

check('leaving the band unmounts and clears intent', () => {
  playbackManager.pause(railKeys[0]);
  playbackManager.setVisible(railKeys[0], false, 0);
  assert(!isMounted(railKeys[0]), 'unmounted once out of the band');
  assert(!isActive(railKeys[0]), 'and not playing');

  playbackManager.setVisible(railKeys[0], true, 1);
  assert(isActive(railKeys[0]), 'coming back gives a clean slate, so it plays');
});

check('autoplay off stops playback but keeps tiles mounted', () => {
  playbackManager.setAutoplayEnabled(false);
  railKeys.forEach((key) => {
    assert(isMounted(key), `${key} should stay mounted`);
    assert(!isActive(key), `${key} should not play`);
  });
  playbackManager.setAutoplayEnabled(true);
  assert(isActive(railKeys[0]), 'playback resumes when autoplay is back on');
});

reset(railKeys);

// ---------------------------------------------------------------------------
console.log('\nbudgets');

const manyKeys = Array.from({ length: 15 }, (_, i) => railKey(`bulk${i}`));

check(`never mounts more than MAX_MOUNTED (${MAX_MOUNTED})`, () => {
  manyKeys.forEach((key) => playbackManager.register(key));
  manyKeys.forEach((key) => playbackManager.setVisible(key, true, 1));
  const { mounted } = playbackManager.getStats();
  assert(mounted <= MAX_MOUNTED, `mounted was ${mounted}`);
});

check(`never plays more than MAX_PLAYING (${MAX_PLAYING})`, () => {
  const { active } = playbackManager.getStats();
  assert(active <= MAX_PLAYING, `active was ${active}`);
});

check('the most recently seen tiles are the ones kept', () => {
  assert(isMounted(manyKeys[14]), 'the newest tile should be mounted');
  assert(!isMounted(manyKeys[0]), 'the oldest should have been dropped');
});

reset(manyKeys);

// ---------------------------------------------------------------------------
console.log('\nscopes - the regression that broke the rail');

const slideKey = modalKey('v3');

check('a viewer slide mounts and plays WITHOUT setScope running first', () => {
 
  railKeys.forEach((key) => playbackManager.register(key));
  railKeys.forEach((key) => playbackManager.setVisible(key, true, 1));

  playbackManager.register(slideKey); // note: no setScope call anywhere
  playbackManager.setVisible(slideKey, true, 1);

  assert(isMounted(slideKey), 'the slide mounts because it exists, not because of a flag');

  assert(!isActive(slideKey), 'but nothing plays until setActive names a slide');
});

check('the rail stays mounted behind the overlay', () => {
  playbackManager.setScope(SCOPE_MODAL); // the app does call this; it must not break anything
  railKeys.forEach((key) => {
    assert(isMounted(key), `${key} stays mounted so the page is not blank`);
  });
  assert(isMounted(slideKey), 'and the slide is still mounted afterwards');
});

check('setActive names the slide that plays', () => {
  playbackManager.setActive(slideKey);
  assert(isActive(slideKey), 'slide should be playing');
});

check('only the CLICKED clip keeps playing in the rail', () => {
  assert(isActive(railKey('v3')), "the clicked clip's tile keeps running");
  railKeys
    .filter((key) => key !== railKey('v3'))
    .forEach((key) => {
      assert(!isActive(key), `${key} must pause while the viewer is open`);
    });
});

check('the same video in the rail is a SEPARATE slot', () => {
  // v3 is on screen twice: rail tile and viewer slide. They must not collide.
  assert(railKey('v3') !== slideKey, 'keys must differ');
  assert(isActive(slideKey), 'the slide plays');
  assert(isActive(railKey('v3')), 'and so does its twin, independently');
});

check('changing slide moves which rail tile keeps playing', () => {
  const nextSlide = modalKey('v5');
  playbackManager.register(nextSlide);
  playbackManager.setVisible(nextSlide, true, 1);
  playbackManager.setActive(nextSlide);

  assert(isActive(railKey('v5')), 'the newly selected clip keeps running behind');
  assert(!isActive(railKey('v3')), 'the previous one stops');
  assert(!isActive(slideKey), 'and so does the previous slide');

  playbackManager.unregister(nextSlide);
  playbackManager.setActive(slideKey);
});

check('only one slide plays in the viewer', () => {
  const neighbour = modalKey('v4');
  playbackManager.register(neighbour);
  playbackManager.setVisible(neighbour, true, 1);

  assert(isMounted(neighbour), 'neighbour is preloaded');
  assert(!isActive(neighbour), 'but does not play');
  assert(isActive(slideKey), 'the selected slide still plays');

  playbackManager.unregister(neighbour);
});

check('closing the viewer brings the rail back, PLAYING', () => {
  // This is the exact sequence React runs on close: slides unmount first
  // (children before parents), then the modal restores the scope.
  playbackManager.unregister(slideKey);
  playbackManager.setScope(SCOPE_RAIL);

  railKeys.forEach((key) => {
    assert(isMounted(key), `${key} must be mounted again`);
    assert(isActive(key), `${key} must be PLAYING again, not frozen`);
  });
});

check('a viewer slide cannot unregister a rail tile', () => {
  // The original bug: unregister(videoId) wiped whichever component got there
  // last. Scoped keys make that impossible.
  playbackManager.unregister(modalKey('v1'));
  assert(isMounted(railKey('v1')), 'the rail tile is untouched');
  assert(isActive(railKey('v1')), 'and still playing');
});

reset(railKeys);

// ---------------------------------------------------------------------------
console.log('\nviewer open/close, under every effect ordering React can use');
function openViewer({ slideIds, selectedId, parentFirst = false, strictMode = false }) {
  const mountSlides = () =>
    slideIds.forEach((id) => {
      playbackManager.register(modalKey(id));
      playbackManager.setVisible(modalKey(id), true, 1);
    });
  const unmountSlides = () => slideIds.forEach((id) => playbackManager.unregister(modalKey(id)));
  const parentEffects = () => {
    playbackManager.setScope(SCOPE_MODAL);
    playbackManager.setActive(modalKey(selectedId));
  };

  if (parentFirst) {
    parentEffects();
    mountSlides();
  } else {
    mountSlides();
    parentEffects();
  }

  if (strictMode) {
    unmountSlides();
    playbackManager.setScope(SCOPE_RAIL); // parent cleanup
    mountSlides();
    parentEffects();
  }
}

function expectOnlyPlaying(selectedId, slideIds) {
  assert(isActive(modalKey(selectedId)), `the SELECTED slide (${selectedId}) must be playing`);
  slideIds
    .filter((id) => id !== selectedId)
    .forEach((id) => {
      assert(!isActive(modalKey(id)), `neighbour ${id} must NOT be playing`);
    });
}

const slideIds = ['v1', 'v2', 'v3'];

[
  { label: 'children-first (how React really orders it)', opts: {} },
  { label: 'parent-first', opts: { parentFirst: true } },
  { label: 'StrictMode double-invoke', opts: { strictMode: true } },
  { label: 'StrictMode + parent-first', opts: { parentFirst: true, strictMode: true } },
].forEach(({ label, opts }) => {
  check(`opening on clip 1 plays clip 1, not its neighbour - ${label}`, () => {
    railKeys.forEach((key) => playbackManager.register(key));
    railKeys.forEach((key) => playbackManager.setVisible(key, true, 1));

    openViewer({ slideIds, selectedId: 'v1', ...opts });
    expectOnlyPlaying('v1', slideIds);

    slideIds.forEach((id) => playbackManager.unregister(modalKey(id)));
    reset(railKeys);
  });
});

check('advancing to the next clip moves playback to it', () => {
  railKeys.forEach((key) => playbackManager.register(key));
  railKeys.forEach((key) => playbackManager.setVisible(key, true, 1));
  openViewer({ slideIds, selectedId: 'v1' });

  playbackManager.setActive(modalKey('v2')); // what VideoModal does on next
  expectOnlyPlaying('v2', slideIds);

  playbackManager.setActive(modalKey('v3'));
  expectOnlyPlaying('v3', slideIds);

  slideIds.forEach((id) => playbackManager.unregister(modalKey(id)));
  reset(railKeys);
});

check('the selected slide survives its slot being torn down and rebuilt', () => {
  railKeys.forEach((key) => playbackManager.register(key));
  railKeys.forEach((key) => playbackManager.setVisible(key, true, 1));
  openViewer({ slideIds, selectedId: 'v2' });
  assert(isActive(modalKey('v2')), 'playing to start with');

  // The rendered window shifts: this slot unmounts and comes straight back.
  playbackManager.unregister(modalKey('v2'));
  playbackManager.register(modalKey('v2'));
  playbackManager.setVisible(modalKey('v2'), true, 1);

  assert(isActive(modalKey('v2')), 'must still be playing after the remount');

  slideIds.forEach((id) => playbackManager.unregister(modalKey(id)));
  reset(railKeys);
});

check("the clicked clip's own tile mounts even when the rail budget is full", () => {

  const bigRail = Array.from({ length: 9 }, (_, i) => railKey(`wide${i}`));
  bigRail.forEach((key) => playbackManager.register(key));
  bigRail.forEach((key) => playbackManager.setVisible(key, true, 1));

  // Five slides, so only MAX_MOUNTED - 5 slots are left for the whole rail.
  const wideSlides = ['wide0', 'wide1', 'wide2', 'wide3', 'wide4'].map(modalKey);
  wideSlides.forEach((key) => playbackManager.register(key));
  wideSlides.forEach((key) => playbackManager.setVisible(key, true, 1));

  // The user clicked the OLDEST tile - last in line on recency alone.
  playbackManager.setActive(modalKey('wide0'));

  assert(isMounted(railKey('wide0')), "the clicked clip's tile must jump the queue");
  assert(isActive(railKey('wide0')), 'and must be the tile still playing behind the overlay');
  assert(playbackManager.getStats().mounted <= MAX_MOUNTED, 'without exceeding the budget');

  wideSlides.forEach((key) => playbackManager.unregister(key));
  reset(bigRail);
});

// ---------------------------------------------------------------------------
console.log(`\n${'-'.repeat(52)}`);
console.log(`passed: ${passed}   failed: ${failures.length}`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exitCode = 1;
} else {
  console.log('All playback manager checks passed.');
}
console.log(`${'-'.repeat(52)}\n`);
