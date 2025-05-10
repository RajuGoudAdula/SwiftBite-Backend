const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'canteen', 'admin'],
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    default: '', // Optional for now
  },
  respondedAt: {
    type: Date,
  }
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);

