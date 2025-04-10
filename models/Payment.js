const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Canteen",
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["upi", "card", "Cash On Delivery"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["SUCCESS", "Fail", "Pending"],
    required: true,
  },
  transactionId: {
    type: String, // This is the ID returned by Google Pay/PhonePe/Paytm
    default: null,
  },
  paymentProvider: {
    type: String, // Example: Google Pay, PhonePe, Paytm, Razorpay
    default: null,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentTime: {
    type: Date,
    default: Date.now,
  },
  refundStatus: {
    type: String,
    enum: ["Not Requested", "Processing", "Refunded"],
    default: "Not Requested",
  },
  refundedAmount: {
    type: Number,
    default: 0,
  },
  refundTime: {
    type: Date,
    default: null,
  },
  webhookRequestData : {
    type: Object,
    default: null,
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

module.exports = mongoose.model("Payment", paymentSchema);
