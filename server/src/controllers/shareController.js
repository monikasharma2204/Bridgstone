'use strict';

const Video = require('../models/Video');
const Share = require('../models/Share');
const { SHARE_PLATFORMS } = Share;
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  requireObjectBody,
  requireObjectId,
  requireEnum,
  optionalString,
} = require('../middleware/validate');


const trackShare = asyncHandler(async (req, res) => {
  const body = requireObjectBody(req.body);
  const videoId = requireObjectId(body.videoId, 'videoId');
  const platform = requireEnum(body.platform, SHARE_PLATFORMS, 'platform');
  const userId = optionalString(body.userId, 'userId', 128);

  const exists = await Video.exists({ _id: videoId });
  if (!exists) {
    throw ApiError.notFound(`No video found with id ${videoId}`);
  }

  const share = await Share.create({ videoId, platform, userId });

  const updated = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { shares: 1 } },
    { new: true, select: 'shares' }
  ).lean();

  res.status(201).json({
    success: true,
    data: {
      videoId,
      platform,
      shares: updated ? updated.shares : 0,
      shareId: String(share._id),
    },
  });
});

module.exports = { trackShare };
