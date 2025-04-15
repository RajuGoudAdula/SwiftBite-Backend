const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  offers: [
    {
      offerType: {
        type: String, // Example: "Buy 1 Get 1", "10% Off"
      },
      discount: {
        type: Number, // Example: 50% Off => 50
      },
      validUntil: {
        type: Date,
      },
    }
  ],
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
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
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true,
  },
  items: [orderItemSchema], // Array of items from cart
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref : "Payment" }, 
  paymentMethod: {
    type: String,
    enum: ["upi", "card", "Cash On Delivery"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Failed", "Pending"],
    default: "Pending",
  },
  sessionId: { type: String, required: true }, 
  orderStatus: {
    type: String,
    enum: ["Pending", "Preparing", "Ready For Pickup", "Completed", "Cancelled"],
    default: "Pending",
  },
  pickupTime: {
    type: Date, // Estimated Pickup Time
  },
  deliveredAt: {
    type: Date, // Time when food is delivered after scanning QR
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

module.exports = mongoose.model("Order", orderSchema);
