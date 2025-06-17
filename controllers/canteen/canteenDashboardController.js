const Order = require('../../models/Order');
const CanteenMenuItem = require('../../models/CanteenMenuItem');
const Product = require('../../models/Product');
const moment = require('moment');
const mongoose = require('mongoose'); // at the top of your file
const Canteen = require('../../models/Canteen');
const User = require('../../models/User');
const { sendNotification } = require('../../services/NotificationService');
const HeroBanner = require('../../models/HeroBanner');
const sendWebPushNotification = require('../../utils/sendWebPushNotification');

// 1. Today's Orders
exports.getTodayOrders = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: "Canteen ID is required" });
    }

    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');

    // Get today's orders for the canteen
    const todayCount = await Order.countDocuments({
      canteenId,
      createdAt: { $gte: today.toDate() }
    });

    // Get yesterday's orders for comparison
    const yesterdayCount = await Order.countDocuments({
      canteenId,
      createdAt: { $gte: yesterday.toDate(), $lt: today.toDate() }
    });

    const changeValue = todayCount - yesterdayCount;
    const positive = changeValue >= 0;
    const change = `${positive ? "+" : "-"}${Math.abs(changeValue)} from yesterday`;

    res.status(200).json({
      count: todayCount,
      change,
      positive
    });
  } catch (err) {
    console.error("Error in getTodayOrders:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// 2. Pending Orders

exports.getPendingOrders = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: "Canteen ID is required" });
    }

    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "day").startOf("day");

    const todayPendingCount = await Order.countDocuments({
      canteenId,
      orderStatus: "Pending",
      createdAt: { $gte: today.toDate() },
    });

    const yesterdayPendingCount = await Order.countDocuments({
      canteenId,
      orderStatus: "Pending",
      createdAt: { $gte: yesterday.toDate(), $lt: today.toDate() },
    });

    const changeValue = todayPendingCount - yesterdayPendingCount;
    const positive = changeValue >= 0;
    const change = `${positive ? "+" : "-"}${Math.abs(changeValue)} from yesterday`;

    res.status(200).json({
      count: todayPendingCount,
      change,
      positive,
    });
  } catch (err) {
    console.error("Error in getPendingOrders:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// 3. Total Revenue
exports.getTotalRevenue = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: "Canteen ID is required" });
    }

    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "day").startOf("day");

    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          canteenId:new mongoose.Types.ObjectId(canteenId),
          createdAt: { $gte: today.toDate() },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const yesterdayRevenueAgg = await Order.aggregate([
      {
        $match: {
          canteenId:new mongoose.Types.ObjectId(canteenId),
          createdAt: { $gte: yesterday.toDate(), $lt: today.toDate() },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const todayRevenue = todayRevenueAgg[0]?.revenue || 0;
    const yesterdayRevenue = yesterdayRevenueAgg[0]?.revenue || 0;
    const change = todayRevenue - yesterdayRevenue;
    const positive = change >= 0;

    res.status(200).json({
      revenue: todayRevenue,
      change: `₹${Math.abs(change).toLocaleString()} ${positive ? "↑" : "↓"} from yesterday`,
      positive,
    });
  } catch (err) {
    console.error("Error in getTotalRevenue:", err);
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
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: "Canteen ID is required" });
    }

    const orders = await Order.find({ canteenId:new mongoose.Types.ObjectId(canteenId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name") // Assuming `name` exists on the User model
      .populate("items.productId", "name");

    const activity = orders.map(order => ({
      message: `Order placed by ${order.userId?.name || "Unknown User"} for ₹${order.totalAmount}`,
      timeAgo: moment(order.createdAt).fromNow(),
    }));

    res.status(200).json(activity);
  } catch (err) {
    console.error("Recent activity error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.toggleCanteen = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: "Canteen ID is required." });
    }

    const canteen = await Canteen.findById(canteenId).populate('collegeId', 'name');

    if (!canteen) {
      return res.status(404).json({ message: "Canteen not found." });
    }

    // Toggle status
    const newStatus = canteen.status === "active" ? "inactive" : "active";
    canteen.status = newStatus;
    await canteen.save();

    // Get users belonging to this canteen
    const users = await User.find({ canteen: canteenId }).select('_id');
    const userIds = users.map(user => user._id);

    const isInactive = newStatus === 'inactive';

    const title = isInactive
      ? 'Canteen is Now Closed.'
      : 'Canteen is Now Open!';

    const message = isInactive
      ? `The canteen at ${canteen?.name}, ${canteen?.collegeId?.name}, is now closed. Thank you for your orders today—we'll be serving again soon!`
      : `The canteen at ${canteen?.name}, ${canteen?.collegeId?.name}, is now open. You're welcome to place your order right away and enjoy your favorite meals!`;

    // ✅ Internal notification
    await sendNotification({
      userId: userIds,
      receiverRole: 'student',
      title,
      message,
      type: 'canteen',
      refModel: 'Canteen',
      relatedRef: canteen._id,
    });

    // ✅ Web Push Notification
    for (const userId of userIds) {
      await sendWebPushNotification(userId, {
        title,
        options: {
          body: message,
          vibrate: [200, 100, 200],
          data: { url: '/' },
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
          ],
          requireInteraction: true
        }
      });
    }

    // ✅ Update banner for "Canteen is Closed"
    if (newStatus === 'inactive' || newStatus === 'active') {
      const bannerTitle = 'Canteen is Closed';
      const banner = await HeroBanner.findOne({ title: bannerTitle });

      if (banner) {
        const index = banner.targetCanteens.findIndex(id => id.toString() === canteenId.toString());

        if (isInactive && index === -1) {
          banner.targetCanteens.push(canteenId);
          await banner.save();
        } else if (!isInactive && index !== -1) {
          banner.targetCanteens.splice(index, 1);
          await banner.save();
        }
      }
    }

    res.status(200).json({
      message: `Canteen is now ${newStatus}.`,
      status: newStatus
    });

  } catch (err) {
    console.error('Toggle Canteen Error:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.getCanteenStatus = async (req,res) => {
  try{
    const {canteenId} = req.params;
    if (!canteenId) {
      return res.status(400).json({ message: "Canteen ID is required." });
    }

    const canteen = await Canteen.findById(canteenId);

    if (!canteen) {
      return res.status(404).json({ message: "Canteen not found." });
    }
    res.status(200).json({
      status: canteen.status,
    });

  }catch(error){
    res.status(500).json({ message: err.message });
  }
}