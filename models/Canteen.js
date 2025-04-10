const mongoose = require("mongoose");

const canteenSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  menuItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "CanteenMenuItem",
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  }],
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifsc: String,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
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

module.exports = mongoose.model("Canteen", canteenSchema);
