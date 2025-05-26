const moment = require("moment");
const College = require("../../models/College");
const Canteen = require("../../models/Canteen");
const Product = require("../../models/Product");
const Order = require("../../models/Order");

const getStartAndEndOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const calculateChange = (today, yesterday) => {
    if (yesterday === 0) {
      if (today === 0) {
        return { change: "0%", positive: false }; // No change
      } else {
        return { change: "∞%", positive: true };  // Infinite growth
      }
    }
  
    const diff = today - yesterday;
    const percent = ((diff / Math.abs(yesterday)) * 100).toFixed(1);
  
    return {
      change: `${diff >= 0 ? "+" : ""}${percent}%`,
      positive: diff >= 0,
    };
  };
  

const getAdminStats = async (req, res) => {
  try {
    // Today's and Yesterday's date range
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const { start: todayStart, end: todayEnd } = getStartAndEndOfDay(today);
    const { start: yesterdayStart, end: yesterdayEnd } = getStartAndEndOfDay(yesterday);

    // Get today and yesterday's counts
    const [totalProductsToday, totalProductsYesterday] = await Promise.all([
      Product.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Product.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    ]);

    const [registeredCollegesToday, registeredCollegesYesterday] = await Promise.all([
      College.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      College.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    ]);

    const [activeCanteensToday, activeCanteensYesterday] = await Promise.all([
      Canteen.countDocuments({ status: "active", createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Canteen.countDocuments({ status: "active", createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    ]);

    const [todaysOrders, yesterdaysOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    ]);

    const stats = [
      {
        title: "Total Products Today",
        value: totalProductsToday,
        ...calculateChange(totalProductsToday, totalProductsYesterday),
      },
      {
        title: "Registered Colleges Today",
        value: registeredCollegesToday,
        ...calculateChange(registeredCollegesToday, registeredCollegesYesterday),
      },
      {
        title: "Active Canteens Today",
        value: activeCanteensToday,
        ...calculateChange(activeCanteensToday, activeCanteensYesterday),
      },
      {
        title: "Today's Orders",
        value: todaysOrders,
        ...calculateChange(todaysOrders, yesterdaysOrders),
      },
    ];

    res.status(200).json({ stats });
  } catch (error) {
    console.error("Error in getAdminStats:", error);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

const getRecentActivity = async (req, res) => {
    try {
      // Define the start of today
      const startOfToday = moment().startOf('day').toDate();
  
      // Get today's recent orders
      const recentOrders = await Order.find({ createdAt: { $gte: startOfToday } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("canteenId", "name")
        .populate("collegeId", "name");
  
      // Get today's recent canteens
      const recentCanteens = await Canteen.find({ createdAt: { $gte: startOfToday } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email phone status createdAt");
  
      // Get today's recent colleges
      const recentColleges = await College.find({ createdAt: { $gte: startOfToday } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name city state status createdAt");
     const recentProduct = await Product.find({ createdAt : { $gte: startOfToday }})
            .sort({ createdAt: -1 })
            .limit(5)
            .select("name createdAt");
  
      res.status(200).json({
        recentOrders,
        recentCanteens,
        recentColleges,
        recentProduct,
      });
    } catch (error) {
      console.error("Error in getRecentActivity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  };

const getTodaysOrders = async (req, res) => {
    try {
      const startOfDay = moment().startOf('day').toDate();
      const endOfDay = moment().endOf('day').toDate();
  
      const todaysOrders = await Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
        .populate("userId", "name email")
        .populate("canteenId", "name")
        .populate("collegeId", "name")
        .populate("items.productId", "name price image");
  
      res.status(200).json({ success: true, orders: todaysOrders });
    } catch (error) {
      console.error("Error fetching today's orders:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

module.exports = {
  getAdminStats,
  getRecentActivity,
  getTodaysOrders,
};
