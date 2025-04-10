const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Assuming `Product` is your item model
      required: true,
      unique: true, // Ensures one review collection per item
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        collegeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "College",
          required: true,
        },
        canteenId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Canteen",
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        review: {
          type: String,
          required: true,
        },
        isAnonymous: {
          type: Boolean,
          default: false, // If the user wants to post anonymously
        },
        images: [
          {
            type: String, // Optional: Users can upload images of the food
          },
        ],
        likes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          },
        ],
        dislikes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          },
        ],
        // ✅ ✅ ✅ Canteen Response for Each Review
        canteenResponse: {
          text: {
            type: String, // Example: "We apologize for the inconvenience"
            default: null,
          },
          respondedAt: {
            type: Date,
            default: null,
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("Review", reviewSchema);
