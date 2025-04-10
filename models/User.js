const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  googleId: { type: String },
  phone: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user","canteen","admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
  college : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "College",
  },
  canteen : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "Canteen",
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  }],
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
