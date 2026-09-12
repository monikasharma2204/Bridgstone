'use strict';

function label(seconds) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const SHOPIFY_CLIPS = [
  { id: 'shopify-1', url: 'https://cdn.shopify.com/videos/c/o/v/5dac6262750d48a08b21e0b51293c4f9.mp4', seconds: 3 },
  {
    id: 'shopify-2',
    url: 'https://cdn.shopify.com/s/files/1/0562/4571/5144/files/clevercat_short_1774274365780.mp4?v=1774274368',
    seconds: 3,
  },
  { id: 'shopify-3', url: 'https://cdn.shopify.com/videos/c/o/v/f529bdb05a1745e8abf4838044111844.mp4', seconds: 10 },
  { id: 'shopify-4', url: 'https://cdn.shopify.com/videos/c/o/v/a9d9b086949e48d5a2e2a819692d3ddf.mp4', seconds: 40 },
].map((clip) => ({
  host: 'shopify',
  url: clip.url,
  previewUrl: '',
  thumbnailUrl: '',
  durationLabel: label(clip.seconds),
}));

const MIXKIT = [
  [1250, 11], [1253, 14], [1256, 11], [1260, 11], [1965, 13], [1968, 15], [51501, 12],
  [1178, 14], [1183, 11], [1190, 15], [1192, 10], [1193, 15], [1195, 15], [1196, 12],
  [1198, 13], [1201, 11], [1205, 10], [1208, 11], [1213, 10], [1214, 12], [1215, 10],
  [1221, 13], [1223, 13], [1226, 10], [1227, 13], [1228, 11], [1229, 10], [1230, 10],
  [1231, 10], [1232, 12], [1234, 16], [1266, 12],
];

const MIXKIT_CLIPS = MIXKIT.map(([id, seconds]) => ({
  host: 'mixkit',
  url: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
  previewUrl: `https://assets.mixkit.co/videos/${id}/${id}-360.mp4`,
  thumbnailUrl: `https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`,
  durationLabel: label(seconds),
}));


const CLIP_POOL = [
  ...SHOPIFY_CLIPS.slice(0, 3),
  ...MIXKIT_CLIPS.slice(0, 9),
  SHOPIFY_CLIPS[3],
  ...MIXKIT_CLIPS.slice(9),
];

const HOST_ORDER = ['mixkit', 'shopify'];
const REPRESENTATIVE = HOST_ORDER.map((host) => CLIP_POOL.find((clip) => clip.host === host)).filter(
  Boolean
);

/** Full quality first, then this clip's own proxy, then a different host. */
function buildSources(primary) {
  const list = [primary.url];
  if (primary.previewUrl) list.push(primary.previewUrl);
  REPRESENTATIVE.forEach((clip) => {
    if (clip.host !== primary.host && !list.includes(clip.url)) list.push(clip.url);
  });
  return list;
}


function buildThumbnail(clip, index) {
  return clip.thumbnailUrl || `https://picsum.photos/seed/socially-approved-${index + 1}/720/1280`;
}

const CONTENT = [
  ['Why everyone is reordering this one', 'Three weeks in and the review section has not stopped moving. Here is what actually changed.', '@nishaa.reviews'],
  ['Unboxing the restock that sold out twice', 'Straight-to-camera first impressions, no edits, no script.', '@thedailyunbox'],
  ['I tested it for 30 days so you do not have to', 'Day one versus day thirty, filmed on the same shelf in the same light.', '@karan.tests'],
  ['The five-second version of a long review', 'Everything that matters, compressed. Full breakdown in the replies.', '@quickcuts'],
  ['Honest take: worth it or hype?', 'I paid for this myself. Here is the part the ads leave out.', '@meera.says'],
  ['Before and after, no filter', 'Same camera, same corner of the room, four weeks apart.', '@studio.plain'],
  ['What changed my mind about it', 'I was ready to return it on day two. Then this happened.', '@arjun.daily'],
  ['The detail nobody mentions', 'Everyone talks about the big feature. This small one is why I kept it.', '@detail.diary'],
  ['Setting it up in under a minute', 'Real-time setup, single take, nothing sped up.', '@setup.in.60'],
  ['Three things I wish I knew first', 'Save yourself the first week of trial and error.', '@wishiknew'],
  ['Side by side with the one I had before', 'Direct comparison, same task, same conditions.', '@sidebyside'],
  ['My honest one-week update', 'Following up on last week. Some of it held up, some of it did not.', '@followups'],
  ['The review that convinced me', 'Reacting to the comment that finally pushed me to order.', '@react.and.buy'],
  ['Tiny upgrade, big difference', 'It cost almost nothing and I notice it every single day.', '@smallwins'],
  ['Testing the claim on camera', 'They said it would do this. Let us find out, live.', '@claimcheck'],
  ['What it looks like after a month of real use', 'No staging, no cleanup before filming. This is the actual state of it.', '@realuse'],
  ['Answering the question in my inbox', 'Fifty people asked the same thing, so here is the answer once.', '@askmeanything'],
  ['The version I would actually recommend', 'There are four options. Only one of them is worth the money.', '@buyersguide'],
  ['Filmed this on the first try', 'One take, no retakes, exactly how it went.', '@onetake'],
  ['Why I returned the expensive one', 'Spent more, got less. Here is the receipt of that lesson.', '@budget.brain'],
  ['A closer look at the finish', 'Macro shots of the part you cannot see in product photos.', '@closeuplab'],
  ['Two minutes that saved me a week', 'The workaround I found by accident.', '@shortcuts'],
  ['Stress testing it on purpose', 'I did the thing the manual tells you not to do.', '@stresstest'],
  ['My favourite thing about it', 'Not the headline feature. The quiet one.', '@favourites'],
  ['What the photos do not show you', 'Scale is the hardest thing to judge online. Here it is next to my hand.', '@truescale'],
  ['Running it back after the update', 'The update changed three things. Two of them are good.', '@afterupdate'],
  ['Reading the one-star reviews out loud', 'Checking each complaint against the thing in front of me.', '@onestarcheck'],
  ['Would I buy it again?', 'Simple question, honest answer, at the end of the clip.', '@wouldibuy'],
  ['The setup I ended up with', 'After four rearrangements, this is the one that stuck.', '@final.setup'],
  ['Small business, big quality', 'Found this through a comment thread and I am glad I did.', '@findfromcomments'],
  ['Everything in the box', 'Laid out flat, counted on camera.', '@inthebox'],
  ['One month later, still using it', 'The real test is whether it is still out on the counter. It is.', '@stillusingit'],
  ['The mistake I made on day one', 'Do not do what I did. It is a two-second fix.', '@learnedthehardway'],
  ['Trying the trick from the comments', 'Someone suggested this and it actually works.', '@tryingyourtips'],
  ['Quiet review, no talking', 'Just the sounds it makes and what it does.', '@asmr.review'],
  ['My top pick of the month', 'Out of eleven things I tried, this is the one.', '@monthlypicks'],
  ['Putting it through a normal day', 'Not a lab test. Just an ordinary Tuesday.', '@ordinarytuesday'],
  ['The thing I kept from the whole haul', 'Sent nine items back. Kept this.', '@haulkeepers'],
  ['Explaining it to someone who has never seen it', 'Zero jargon version, start to finish.', '@plainenglish'],
  ['Last one, and the best one', 'Saved my favourite for the end of the series.', '@seriesfinale'],
];

const MIN_COUNT = 30;
const MAX_COUNT = 40;

const DEFAULT_COUNT = Math.min(MAX_COUNT, Math.max(MIN_COUNT, CLIP_POOL.length));

function buildSeedVideos(count = DEFAULT_COUNT) {
  const total = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Number(count) || DEFAULT_COUNT));

  return Array.from({ length: total }, (_, index) => {
    const clip = CLIP_POOL[index % CLIP_POOL.length];
    const [title, description, creator] = CONTENT[index % CONTENT.length];
    const sources = buildSources(clip);

    return {
      title,
      description,
      videoUrl: sources[0],
      previewUrl: clip.previewUrl,
      sources,
      thumbnailUrl: buildThumbnail(clip, index),
      likes: 0,
      shares: 0,
      creator,
      durationLabel: clip.durationLabel,
      order: index,
    };
  });
}

module.exports = { buildSeedVideos, MIN_COUNT, MAX_COUNT, DEFAULT_COUNT };
