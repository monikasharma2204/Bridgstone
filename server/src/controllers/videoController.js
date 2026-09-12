'use strict';

const Video = require('../models/Video');
const Like = require('../models/Like');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { requireObjectId, parseIntParam, optionalString } = require('../middleware/validate');

const PUBLIC_FIELDS =
  '_id title description videoUrl previewUrl sources thumbnailUrl likes shares creator durationLabel order createdAt updatedAt';

const listVideos = asyncHandler(async (req, res) => {
  const limit = parseIntParam(req.query.limit, { fallback: 40, min: 1, max: 100, field: 'limit' });
  const page = parseIntParam(req.query.page, { fallback: 1, min: 1, max: 1000, field: 'page' });
  const userId = optionalString(req.query.userId, 'userId', 128);

  const [videos, total] = await Promise.all([
    Video.find({})
      .select(PUBLIC_FIELDS)
      .sort({ order: 1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Video.countDocuments({}),
  ]);

  let likedIds = new Set();
  if (userId && videos.length) {
    const likes = await Like.find({
      userId,
      videoId: { $in: videos.map((v) => v._id) },
    })
      .select('videoId')
      .lean();
    likedIds = new Set(likes.map((like) => String(like.videoId)));
  }

  res.status(200).json({
    success: true,
    count: videos.length,
    total,
    page,
    limit,
    data: videos.map((video) => ({
      ...video,
      _id: String(video._id),
      likedByMe: likedIds.has(String(video._id)),
    })),
  });
});

/** GET /api/videos/:id */
const getVideoById = asyncHandler(async (req, res) => {
  const id = requireObjectId(req.params.id, 'id');

  const video = await Video.findById(id).select(PUBLIC_FIELDS).lean();
  if (!video) {
    throw ApiError.notFound(`No video found with id ${id}`);
  }

  res.status(200).json({
    success: true,
    data: { ...video, _id: String(video._id) },
  });
});

module.exports = { listVideos, getVideoById };
