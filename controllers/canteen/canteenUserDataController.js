const User = require('../../models/User');
const mongoose = require('mongoose');

// Controller to get user statistics and data for a specific canteen
const getUserStatistics = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate the date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Get the total number of users for the specific canteen
    const totalUsers = await User.countDocuments({
      canteen:new mongoose.Types.ObjectId(canteenId),
    });

    // Get the new users for the canteen created within the date range
    const newUsers = await User.countDocuments({
      canteen:new mongoose.Types.ObjectId(canteenId),
      createdAt: { $gte: start, $lte: end },
    });

    // Get the active users for the canteen (users who placed an order within the date range)
    const activeUsers = await User.aggregate([
      { $match: { canteen:new mongoose.Types.ObjectId(canteenId) } },
      { $lookup: { from: 'orders', localField: '_id', foreignField: 'user', as: 'orders' } },
      { $unwind: '$orders' },
      { $match: { 'orders.createdAt': { $gte: start, $lte: end } } },
      { $group: { _id: '$_id' } },
    ]);

    // Get the average session duration for the canteen (this is an example, adjust based on actual data)
    const avgSession = 10; // Example: assuming average session of 10 minutes (this should be calculated from actual data)

    // Real User Growth Data: Track new users by month (or any other time period)
    const growthData = await User.aggregate([
      { $match: { canteen:new mongoose.Types.ObjectId(canteenId), createdAt: { $gte: start, $lte: end } } },
      {
        $project: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
        },
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          users: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Map the result to a date string and the number of users
    const formattedGrowthData = growthData.map((item) => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      users: item.users,
    }));

    // Real Demographics Data: Calculate gender distribution
    const demographics = await User.aggregate([
      { $match: { canteen:new mongoose.Types.ObjectId(canteenId) } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate the percentage of each gender
    const totalUsersInCanteen = await User.countDocuments({
      canteen:new mongoose.Types.ObjectId(canteenId),
    });

    const formattedDemographics = demographics.map((item) => ({
      gender: item._id,
      percentage: ((item.count / totalUsersInCanteen) * 100).toFixed(2),
    }));

    // Format the response data
    const userStats = {
      totalUsers: { value: totalUsers },
      newUsers: { value: newUsers },
      activeUsers: { value: activeUsers.length },
      avgSession: { value: `${avgSession}m` },
      growth: formattedGrowthData,
      demographics: formattedDemographics,
    };

    res.status(200).json(userStats);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getUserStatistics };
