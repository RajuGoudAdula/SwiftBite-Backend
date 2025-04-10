const Order = require('../../models/Order');
const CanteenMenuItem = require('../../models/CanteenMenuItem');
const Product = require('../../models/Product');
const moment = require('moment');
const mongoose = require('mongoose'); // at the top of your file

// 1. Today's Orders
exports.getTodayOrders = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');

    const todayCount = await Order.countDocuments({ createdAt: { $gte: today.toDate() } });
    const yesterdayCount = await Order.countDocuments({
      createdAt: { $gte: yesterday.toDate(), $lt: today.toDate() },
    });

    const change = todayCount - yesterdayCount;
    const positive = change >= 0;

    res.status(200).json({ count: todayCount, change: `${change} from yesterday`, positive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Pending Orders
exports.getPendingOrders = async (req, res) => {
  try {
    const count = await Order.countDocuments({ orderStatus: 'Pending' });
    const change = "+3 from yesterday"; // Optional: implement logic if needed
    const positive = true; // Placeholder

    res.status(200).json({ count, change, positive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Total Revenue
exports.getTotalRevenue = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');

    const todayRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: today.toDate() }, paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]);
    const yesterdayRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: yesterday.toDate(), $lt: today.toDate() }, paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]);

    const todayRevenue = todayRevenueAgg[0]?.revenue || 0;
    const yesterdayRevenue = yesterdayRevenueAgg[0]?.revenue || 0;
    const change = todayRevenue - yesterdayRevenue;
    const positive = change >= 0;

    res.status(200).json({
      revenue: todayRevenue,
      change: `₹${Math.abs(change).toLocaleString()} ${positive ? '↑' : '↓'} from yesterday`,
      positive,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getPopularItem = async (req, res) => {
    try {
      const agg = await Order.aggregate([
        { $unwind: '$items' },
        { 
          $group: { 
            _id: '$items.productId', // corrected field
            orderCount: { $sum: '$items.quantity' } 
          } 
        },
        { $sort: { orderCount: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'Product', // should match the name of the MongoDB collection
            localField: '_id',
            foreignField: '_id',
            as: 'item',
          },
        },
        { $unwind: '$item' },
        {
          $project: {
            itemName: '$item.name',
            orderCount: 1,
          },
        },
      ]);
      console.log(arr);
      if (agg.length > 0) {
        res.status(200).json(agg[0]);
      } else {
        res.status(200).json({ itemName: 'N/A', orderCount: 0 });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching menu item", error: err.message });
    }
  };
  


// 5. Recent Activity
exports.getRecentActivity = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('items.itemId');
    const activity = orders.map(order => ({
      message: `Order placed by ${order.userId || 'Unknown User'} for ₹${order.totalAmount}`,
      timeAgo: moment(order.createdAt).fromNow(),
    }));

    res.status(200).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
