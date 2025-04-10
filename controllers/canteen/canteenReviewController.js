const Reviews = require("../../models/Review");
const Orders = require("../../models/Order");
const Users = require("../../models/User");

exports.getReviews = async (req, res) => {
    try {
      const { canteenId } = req.params;
  
      // Step 1: Fetch reviews for the specified canteen and populate user and order details
      const allReviews = await Reviews.find({ "reviews.canteenId": canteenId })
        .populate("reviews.userId", "name email")
        .populate("reviews.orderId", "items totalAmount paymentMethod paymentStatus orderStatus deliveredAt createdAt");
  
      const extractedReviews = [];
  
      for (const doc of allReviews) {
        for (const r of doc.reviews) {
          if (r.canteenId.toString() === canteenId) {
            extractedReviews.push({
              reviewId: r._id,
              productId: doc.productId,
              rating: r.rating,
              review: r.review,
              isAnonymous: r.isAnonymous,
              images: r.images,
              likes: r.likes,
              dislikes: r.dislikes,
              canteenResponse: r.canteenResponse,
              createdAt: r.createdAt,
  
              // user info only if not anonymous
              user: r.isAnonymous
                ? null
                : r.userId
                ? {
                    name: r.userId.name,
                    email: r.userId.email,
                  }
                : null,
  
              // order info
              order: r.orderId
                ? {
                    items: r.orderId.items,
                    totalAmount: r.orderId.totalAmount,
                    paymentMethod: r.orderId.paymentMethod,
                    paymentStatus: r.orderId.paymentStatus,
                    deliveredAt: r.orderId.deliveredAt,
                    createdAt: r.orderId.createdAt,
                  }
                : null,
            });
          }
        }
      }
  
      return res.status(200).json(extractedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  };
  


// ✅ Canteen replies to a specific review
exports.replayReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replayText } = req.body;

    const updated = await Reviews.findOneAndUpdate(
      { "reviews._id": reviewId },
      {
        $set: {
          "reviews.$.canteenResponse": {
            text: replayText,
            respondedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.status(200).json({ message: "Reply added successfully" });
  } catch (error) {
    console.error("Error replying to review:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
