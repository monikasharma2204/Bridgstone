'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    videoUrl: {
      type: String,
      required: [true, 'videoUrl is required'],
      trim: true,
    },

    previewUrl: {
      type: String,
      default: '',
      trim: true,
    },
 
    sources: {
      type: [String],
      default: undefined,
    },
  
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },

    creator: {
      type: String,
      default: 'Socially Approved',
      trim: true,
      maxlength: 80,
    },
    durationLabel: {
      type: String,
      default: '',
      trim: true,
      maxlength: 16,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      versionKey: false,
      transform(_doc, ret) {
        ret._id = String(ret._id);
        return ret;
      },
    },
  }
);

videoSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema);
