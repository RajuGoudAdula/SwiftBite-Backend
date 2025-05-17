// models/HeroBanner.js

const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ad', 'offer', 'system', 'event', 'announcement'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: String,
  description: String,

  media: {
    imageUrl: {
      type: String,
      required: true,
    },
    mobileImageUrl: String, // Optional for mobile-optimized images
    videoUrl: String,       // Optional for video banners
    altText: String,
  },

  cta: {
    text: String,      // E.g., "Shop Now", "Learn More"
    link: String,      // Destination URL
    type: {
      type: String,
      enum: ['external', 'internal'],
      default: 'internal',
    },
    trackClick: {
      type: Boolean,
      default: true,
    },
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  personalizationTags: {
    type: [String], // ['new_users', 'frequent_buyers', 'all', etc.]
    default: ['all'],
  },

  targetCanteens: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Canteen',
    default: [],
  },

  schedule: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
  },

  displayRules: {
    platforms: {
      type: [String],
      enum: ['web', 'mobile', 'tablet'],
      default: ['web', 'mobile'],
    },
    maxImpressionsPerUser: {
      type: Number,
      default: 5,
    },
  },

  analytics: {
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HeroBanner", heroBannerSchema);