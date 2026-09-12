'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const SHARE_PLATFORMS = ['copy', 'whatsapp', 'facebook', 'x', 'native', 'other'];

const shareSchema = new Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: {
        values: SHARE_PLATFORMS,
        message: `platform must be one of: ${SHARE_PLATFORMS.join(', ')}`,
      },
      lowercase: true,
      trim: true,
    },
    userId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 128,
    },
  },
  { timestamps: true }
);

shareSchema.index({ createdAt: -1 });

const Share = mongoose.models.Share || mongoose.model('Share', shareSchema);

module.exports = Share;
module.exports.SHARE_PLATFORMS = SHARE_PLATFORMS;
