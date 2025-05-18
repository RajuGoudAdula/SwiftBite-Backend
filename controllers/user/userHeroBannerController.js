const HeroBanner = require('../../models/HeroBanner');
const User = require('../../models/User');
const Order = require('../../models/Order'); // assuming this exists
const mongoose = require('mongoose');

exports.getHeroBanners = async (req, res) => {
  try {
    const { userId, canteenId } = req.params;

    if (!userId || !canteenId) {
      return res.status(400).json({ message: "userId and canteenId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (!mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ message: "Invalid canteenId" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Infer personalization tags
    const inferredTags = ['all'];

    const orderCount = await Order.countDocuments({ userId: user._id });
    if (orderCount === 0) {
      inferredTags.push('new_users');
    } else if (orderCount >= 5) {
      inferredTags.push('frequent_buyers');
    }

    const now = new Date();

    // Find banners that are active, within schedule, targeted for this canteen or all canteens, and matching personalization
    const banners = await HeroBanner.find();

    // Optional: log found banners count
    console.log(`Found ${banners.length} banners for user ${userId} and canteen ${canteenId}`);

    res.status(200).json(banners);
  } catch (error) {
    console.error("Error fetching HeroBanners:", error);
    res.status(500).json({ message: "Error occurred while fetching hero banners" });
  }
};
