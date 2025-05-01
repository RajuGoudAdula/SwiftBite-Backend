const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional if toAll is true
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen' }, // Optional, only if needed
  receiverRole: { type: String, enum: ['student', 'canteen', 'admin'], required: true },
  
  title: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'system', 'promo'], default: 'system' },
  isRead: { type: Boolean, default: false },

  relatedRef: { type: mongoose.Schema.Types.ObjectId },
  refModel: { type: String },

  toAll: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
