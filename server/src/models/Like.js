'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
  },
  { timestamps: true }
);


likeSchema.index({ videoId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.Like || mongoose.model('Like', likeSchema);
