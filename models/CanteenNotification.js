const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedRef: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  refModel: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('CanteenNotification', notificationSchema);
