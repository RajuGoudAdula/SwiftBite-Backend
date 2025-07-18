const Reviews = require("../../models/Review");
const User = require("../../models/User");
const Product = require("../../models/Product");
const Feedback = require("../../models/Feedback");



// Fetch all reviews for a specific canteen
exports.getAllReviewsForCanteen = async (req, res) => {
  try {
    const { canteenId } = req.params;

    const reviewDocs = await Reviews.find({
      "reviews.canteenId": canteenId, // Only reviews matching canteen
    })
      .populate('productId', 'name')
      .populate('reviews.userId', 'name')
      .populate('reviews.orderId', '_id')
      .populate('reviews.collegeId', 'name')
      .populate('reviews.canteenId', 'name');
    let allReviews = [];

    reviewDocs.forEach((doc) => {
      doc.reviews.forEach((r) => {
      
        if (r.canteenId._id.toString() === canteenId) { // Ensure exact match
          allReviews.push({
            _id: r._id,
            product: doc.productId.name,
            productId: doc.productId._id,
            user: r.isAnonymous ? 'Anonymous' : r.userId?.name,
            userId: r.userId?._id,
            rating: r.rating,
            review: r.review,
            images: r.images,
            likes: r.likes.length,
            dislikes: r.dislikes.length,
            canteenResponse: r.canteenResponse,
            createdAt: r.createdAt,
            orderId : r.orderId,
          });
        }
      });
    });

    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const userCount = {};
    const productCount = {};

    allReviews.forEach((r) => {
      if (r.userId) userCount[r.userId] = (userCount[r.userId] || 0) + 1;
      if (r.productId) productCount[r.productId] = (productCount[r.productId] || 0) + 1;
    });

    const mostActiveReviewerId = Object.entries(userCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostReviewedProductId = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0];

    const mostActiveReviewer = mostActiveReviewerId
      ? await User.findById(mostActiveReviewerId).select('name email')
      : null;
    const mostReviewedProduct = mostReviewedProductId
      ? await Product.findById(mostReviewedProductId).select('name')
      : null;

    res.status(200).json({
      totalReviews,
      averageRating,
      mostActiveReviewer,
      mostReviewedProduct,
      allReviews,
    });
  } catch (error) {
    console.error("Error fetching canteen reviews:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🛠 Canteen responds to a specific user review
exports.respondToReview = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { reviewId , response , orderId } = req.body;

    if(!canteenId){
      return res.status(404).json({ message: "CanteenId is required" });
    }

    if(!reviewId){
      return res.status(404).json({ message: "ReviewId is required"});
    }

    if(!orderId){
      return res.status(404).json({ message: "OrderId is required"});
    }

    const reviewDoc = await Reviews.findOneAndUpdate(
      {
        "reviews._id": reviewId,
        "reviews.canteenId": canteenId,
        "reviews.orderId" : orderId,
      },
      {
        $set: {
          "reviews.$.canteenResponse.text": response,
          "reviews.$.canteenResponse.respondedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!reviewDoc) {
      return res.status(404).json({ message: "Review not found for this canteen" });
    }

    const updatedReview = reviewDoc.reviews.find(
      (r) => r._id.toString() === reviewId.toString()
    );

    res.status(200).json({ message: "Response added successfully" , review : updatedReview ,success : true});
  } catch (error) {
    console.error("Error responding to review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🛠 Edit a review for specific canteen
exports.editReview = async (req, res) => {
  try {
    const { productId, reviewId, canteenId } = req.params;
    const { rating, reviewText } = req.body;

    const reviewDoc = await Review.findOneAndUpdate(
      {
        productId,
        "reviews._id": reviewId,
        "reviews.canteenId": canteenId,
      },
      {
        $set: {
          "reviews.$.rating": rating,
          "reviews.$.review": reviewText,
        },
      },
      { new: true }
    );

    if (!reviewDoc) {
      return res.status(404).json({ message: "Review not found for this canteen" });
    }

    res.status(200).json({ message: "Review updated successfully" });
  } catch (error) {
    console.error("Error editing review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🛠 Delete a review for a specific product (canteen item)
exports.deleteReview = async (req, res) => {
  try {
    const { productId, orderId, userId } = req.params;

    if (!productId || !orderId || !userId) {
      return res.status(400).json({ message: "Missing required parameters: productId, orderId, or userId." });
    }

    const reviewDoc = await Reviews.findOne({ productId });

    if (!reviewDoc) {
      return res.status(404).json({ message: "No reviews found for this product." });
    }

    const originalLength = reviewDoc.reviews.length;

    reviewDoc.reviews = reviewDoc.reviews.filter(
      (r) => !(r.orderId.toString() === orderId && r.userId.toString() === userId)
    );

    if (reviewDoc.reviews.length === originalLength) {
      return res.status(403).json({ message: "It does not exist." });
    }

    await reviewDoc.save();

    res.status(200).json({ 
      success: true,
      message: "Review deleted successfully.",
      data: { productId, orderId }
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Something went wrong while deleting the review. Please try again later." });
  }
};



exports.getCanteenFeedbacks = async (req, res) => {
  const { canteenId } = req.params;

  try {
    const feedbacks = await Feedback.find({
      canteenId,
      canteenResponseAdmin: { $ne: '' } 
    }).sort({ createdAt: -1 });

    res.status(200).json(feedbacks);
  } catch (err) {
    console.error('Error fetching canteen feedbacks:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
