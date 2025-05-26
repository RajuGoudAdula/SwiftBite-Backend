const mongoose = require('mongoose');
const HeroBanner = require('../../models/HeroBanner');
const User = require('../../models/User');
const Order = require('../../models/Order'); // assuming this exists


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
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Infer personalization tags
    const inferredTags = ['all'];

    const orderCount = await Order.countDocuments({ userId });
    if (orderCount === 0) {
      inferredTags.push('new_users');
    } else if (orderCount >= 5) {
      inferredTags.push('frequent_buyers');
    }
    
    const now = new Date();
    
    const banners = await HeroBanner.find({ isActive: true });

    const filteredBanners = banners.filter(banner => {
      const inSchedule = banner.schedule.startDate <= now && banner.schedule.endDate >= now;

      if (!inSchedule) return false;

      const matchesTags = banner.personalizationTags.includes('all') ||
                          banner.personalizationTags.some(tag => inferredTags.includes(tag));

      const canteenMatch = banner.targetCanteens.some(
        canteenObjId => canteenObjId.toString() === canteenId
      );
      return matchesTags || canteenMatch;
    });

    res.status(200).json(filteredBanners);
  } catch (error) {
    console.error("Error fetching HeroBanners:", error);
    res.status(500).json({ message: "Error occurred while fetching hero banners" });
  }
};
