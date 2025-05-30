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
    index: true, 
  },

  password: {
    type: String,
    select: false, 
  },

  googleId: {
    type: String,
    index: true, 
  },

  phone: {
    type: String,
    index: true, 
  },

  role: {
    type: String,
    enum: ["user", "canteen", "admin"],
    default: "user",
    index: true, 
  },

  isVerified: {
    type: Boolean,
    default: false,
  },


  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    index: true, 
  },

  canteen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Canteen",
    index: true, 
  },

  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  }],

  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
}, {
  timestamps: true, 
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

module.exports = mongoose.model("User", userSchema);
