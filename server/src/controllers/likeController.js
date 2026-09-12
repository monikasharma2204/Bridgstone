'use strict';

const Video = require('../models/Video');
const Like = require('../models/Like');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  requireObjectBody,
  requireObjectId,
  requireEnum,
  resolveUserId,
} = require('../middleware/validate');

const toggleLike = asyncHandler(async (req, res) => {
  const body = requireObjectBody(req.body);
  const videoId = requireObjectId(body.videoId, 'videoId');
  const userId = resolveUserId(req, body.userId);
  const action =
    body.action === undefined || body.action === null || body.action === ''
      ? null
      : requireEnum(body.action, ['like', 'unlike'], 'action');

  const video = await Video.findById(videoId).select('_id likes').lean();
  if (!video) {
    throw ApiError.notFound(`No video found with id ${videoId}`);
  }

  const existing = await Like.findOne({ videoId, userId }).select('_id').lean();
  const alreadyLiked = Boolean(existing);
  const shouldBeLiked = action === null ? !alreadyLiked : action === 'like';

  // No state change: report the current truth without touching the counter.
  if (shouldBeLiked === alreadyLiked) {
    return res.status(200).json({
      success: true,
      data: { videoId, userId, liked: alreadyLiked, likes: video.likes, changed: false },
    });
  }

  let likes = video.likes;

  if (shouldBeLiked) {
    try {
      await Like.create({ videoId, userId });
    } catch (err) {
      // Lost a race with a concurrent request - the like already exists.
      if (err && err.code === 11000) {
        const current = await Video.findById(videoId).select('likes').lean();
        return res.status(200).json({
          success: true,
          data: { videoId, userId, liked: true, likes: current ? current.likes : likes, changed: false },
        });
      }
      throw err;
    }
    const updated = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { likes: 1 } },
      { new: true, select: 'likes' }
    ).lean();
    likes = updated ? updated.likes : likes + 1;
  } else {
    const removed = await Like.deleteOne({ videoId, userId });
    if (removed.deletedCount === 0) {
      // Lost a race with a concurrent unlike - counter already adjusted.
      const current = await Video.findById(videoId).select('likes').lean();
      return res.status(200).json({
        success: true,
        data: { videoId, userId, liked: false, likes: current ? current.likes : likes, changed: false },
      });
    }
    // `likes: { $gt: 0 }` keeps the counter from ever going negative.
    const updated = await Video.findOneAndUpdate(
      { _id: videoId, likes: { $gt: 0 } },
      { $inc: { likes: -1 } },
      { new: true, select: 'likes' }
    ).lean();
    if (updated) {
      likes = updated.likes;
    } else {
      const current = await Video.findById(videoId).select('likes').lean();
      likes = current ? current.likes : 0;
    }
  }

  return res.status(200).json({
    success: true,
    data: { videoId, userId, liked: shouldBeLiked, likes, changed: true },
  });
});

module.exports = { toggleLike };
