const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: [
        "register",
        "reset-password",
        "verify-email",
        "change-email",
        "change-phone",
        "delete-account",
    ],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

module.exports = mongoose.model("OtpStore", otpSchema);
