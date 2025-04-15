const Review = require("../../models/Review");
const Canteen = require('../../models/Canteen');

exports.addReview = async (req, res) => {
  try {
    const { userId, orderId, canteenId, rating, review ,isAnonymous} = req.body;
    const { productId } = req.params;
    if (!productId || !userId || !orderId || !canteenId || !rating || !review) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // ✅ Fetch collegeId properly
    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(400).json({ message: "No canteen found for this canteenId" });
    }
    const collegeId = canteen.collegeId // Extract actual ID

    let reviewDoc = await Review.findOne({ productId });

    if (!reviewDoc) {
      reviewDoc = new Review({ productId, reviews: [] });
    }

    // Check if the user has already reviewed this product
    const existingReview = reviewDoc.reviews.find(
      (r) => r.userId.toString() === userId && r.orderId.toString() === orderId
    );
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }

    const newReview = {
      userId,
      orderId,
      collegeId, // ✅ Now this is correct
      canteenId,
      rating,
      review,
      isAnonymous,
      createdAt: new Date(),
    };

    reviewDoc.reviews.push(newReview);
    await reviewDoc.save();

    res.status(201).json({ message: "Review posted successfully", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.updateReview = async (req, res) => {
  try {
    const { productId, orderId } = req.params;
    const { userId, rating, review, isAnonymous, images, collegeId, canteenId} = req.body;

    if (!productId || !orderId || !userId) {
      return res.status(400).json({ message: "Product ID, Order ID, and User ID are required." });
    }

    let reviewDoc = await Review.findOne({ productId });

    if (!reviewDoc) {
      return res.status(404).json({ message: "No reviews found for this product." });
    }

    let reviewToUpdate = reviewDoc.reviews.find(
      (r) => r.orderId.toString() === orderId && r.userId.toString() === userId
    );

    if (!reviewToUpdate) {
      return res.status(403).json({ message: "Review not found or you are not authorized to update this review." });
    }

    // ✅ Update only provided fields
    if (rating !== undefined) reviewToUpdate.rating = rating;
    if (review !== undefined) reviewToUpdate.review = review;
    if (isAnonymous !== undefined) reviewToUpdate.isAnonymous = isAnonymous;
    if (images !== undefined) reviewToUpdate.images = images;

    reviewToUpdate.updatedAt = new Date();

    await reviewDoc.save();

    // ✅ Correct response structure
    const formattedReview = {
      updatedReview: {
        [productId]: {
          rating: reviewToUpdate.rating,
          review: reviewToUpdate.review,
          isAnonymous: reviewToUpdate.isAnonymous,
          updatedAt: reviewToUpdate.updatedAt,
        },
      },
    };

    res.status(200).json({ message: "Review updated successfully", review: formattedReview });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


  

  exports.deleteReview = async (req, res) => {
    try {
      const { productId, orderId } = req.params;
      const { userId } = req.query;
  
      if (!productId || !orderId || !userId) {
        return res.status(400).json({ message: "Product ID, Order ID, and User ID are required." });
      }
  
      let reviewDoc = await Review.findOne({ productId });
  
      if (!reviewDoc) {
        return res.status(404).json({ message: "No reviews found for this product." });
      }
  
      const reviewIndex = reviewDoc.reviews.findIndex(
        (r) => r.orderId.toString() === orderId && r.userId.toString() === userId
      );
  
      if (reviewIndex === -1) {
        return res.status(403).json({ message: "Review not found or you are not authorized to delete this review." });
      }
  
      // ✅ Remove the review
      reviewDoc.reviews.splice(reviewIndex, 1);
      await reviewDoc.save();
  
      res.status(200).json({ message: "Review deleted successfully" ,orderId,productId});
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };
  


exports.getUserReview = async (req, res) => {
  try {
    const { orderId, userId } = req.params;

    if (!orderId || !userId) {
      return res.status(400).json({ message: "Order ID and User ID are required." });
    }

    // Fetch all review documents that contain a review for this user and order
    const reviewDocs = await Review.find({
      "reviews.userId": userId,
      "reviews.orderId": orderId,
    }).select("productId reviews");

    if (!reviewDocs.length) {
      return res.status(404).json({ message: "No reviews found for this order by the user." });
    }

    // Format the response
    const formattedReviews = {
      userId,
      orderId,
      reviews: {},
    };

    reviewDocs.forEach((doc) => {
      // Find the single review by this user for this order (since only one review per order per product)
      const userReview = doc.reviews.find(
        (r) => r.userId.toString() === userId && r.orderId.toString() === orderId
      );

      if (userReview) {
        formattedReviews.reviews[doc.productId] = {
          rating: userReview.rating,
          review: userReview.review,
          isAnonymous: userReview.isAnonymous,
          createdAt: userReview.createdAt,
          canteenResponse :userReview.canteenResponse,
        };
      }
    });

    return res.status(200).json(formattedReviews);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.likeReview = async (req, res) => {
  try {
    const { itemId, reviewId } = req.params; // `itemId` is actually `productId`
    const {userId} = req.body; // Authenticated user

    // Find the review document for the product
    const reviewDoc = await Review.findOne({ productId: itemId });
    if (!reviewDoc) {
      return res.status(404).json({ message: "No reviews found for this product" });
    }

    // Find the specific review inside the reviews array
    const review = reviewDoc.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the user has already liked the review
    const likeIndex = review.likes.findIndex((like) => like.userId.toString() === userId);
    const dislikeIndex = review.dislikes.findIndex((dislike) => dislike.userId.toString() === userId);

    if (likeIndex !== -1) {
      // If already liked, remove the like (unlike)
      review.likes.splice(likeIndex, 1);
    } else {
      // If not liked yet, add the like
      review.likes.push({ userId });

      // If the user previously disliked, remove the dislike
      if (dislikeIndex !== -1) {
        review.dislikes.splice(dislikeIndex, 1);
      }
    }

    // Save the updated review document
    await reviewDoc.save();

    return res.status(200).json({
      message: "Review like updated successfully",
      likes: review.likes.length,
      dislikes: review.dislikes.length,
    });

  } catch (error) {
    return res.status(500).json({ message: "Error while liking review" });
  }
};


exports.disLikeReview = async (req, res) => {
  try {
    const { itemId, reviewId } = req.params; // `itemId` is actually `productId`
    const {userId} = req.body; // Authenticated user

    // Find the review document for the product
    const reviewDoc = await Review.findOne({ productId: itemId });
    if (!reviewDoc) {
      return res.status(404).json({ message: "No reviews found for this product" });
    }

    // Find the specific review inside the reviews array
    const review = reviewDoc.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the user has already disliked the review
    const dislikeIndex = review.dislikes.findIndex((dislike) => dislike.userId.toString() === userId);
    const likeIndex = review.likes.findIndex((like) => like.userId.toString() === userId);

    if (dislikeIndex !== -1) {
      // If already disliked, remove the dislike (undo dislike)
      review.dislikes.splice(dislikeIndex, 1);
    } else {
      // If not disliked yet, add the dislike
      review.dislikes.push({ userId });

      // If the user previously liked, remove the like
      if (likeIndex !== -1) {
        review.likes.splice(likeIndex, 1);
      }
    }

    // Save the updated review document
    await reviewDoc.save();

    return res.status(200).json({
      message: "Review dislike updated successfully",
      likes: review.likes.length,
      dislikes: review.dislikes.length,
    });

  } catch (error) {
    return res.status(500).json({ message: "Error while disliking review" });
  }
};
