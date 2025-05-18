const mongoose = require("mongoose");

const heroBannerSchema = new mongoose.Schema({
  // Banner purpose
  type: {
    type: String,
    enum: ['ad', 'offer', 'system', 'event', 'announcement'],
    required: true,
  },

  // Basic content
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },

  // Media content
  media: {
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    altText: { type: String, default: "Banner image" },
  },

  // Call to action button
  cta: {
    text: { type: String, default: "" },      // E.g., "Shop Now"
    link: { type: String, default: "" },      // URL or route
    type: {
      type: String,
      enum: ['external', 'internal'],
      default: 'internal',
    },
    trackClick: { type: Boolean, default: true },
  },

  // Banner display status
  isActive: { type: Boolean, default: true },

  // Targeting
  personalizationTags: {
    type: [String],
    enum: ['all', 'new_users', 'frequent_buyers', 'admin', 'mobile_users'],
    default: ['all'],
  },

  targetCanteens: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Canteen',
    default: [],
  },

  // Display schedule
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timeZone: {
      type: String,
      enum: [
        'UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London',
        'Asia/Tokyo', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Shanghai'
      ],
      default: 'UTC',
    },
  },

  // Display rules
  displayRules: {
    platforms: {
      type: [String],
      enum: ['web', 'mobile', 'tablet'],
      default: ['web', 'mobile'],
    },
    maxImpressionsPerUser: { type: Number, default: 5 },
  },

  // Metrics tracking
  analytics: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },

  // Audit information
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
