// models/HeroBanner.js

const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ad', 'offer','system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: String,
  description: String,
  imageUrl: {
    type: String,
    required: true,
  },
  ctaText: String, // Call-to-action text like "Shop Now", "Claim Offer"
  link: String, // URL to redirect when banner is clicked
  isActive: {
    type: Boolean,
    default: true,
  },
  targetAudience: {
    type: [String], // Examples: ['new_users', 'students', 'all']
    default: ['all'],
  },
  startDate: {
    type: Date,
    required: true,
  },
  targetCanteens: {
    type: [mongoose.Schema.Types.ObjectId], 
    ref: 'Canteen',
    default: []  // Empty means all Canteens
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HeroBanner', heroBannerSchema);
