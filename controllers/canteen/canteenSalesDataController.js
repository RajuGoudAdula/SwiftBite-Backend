// controllers/analyticsController.js
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const mongoose = require('mongoose');

const getSalesData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { canteenId } = req.params; // Get canteenId from request parameters

    if (!canteenId) {
      return res.status(400).json({ error: "Canteen ID is required." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the full end date

    // 1. Fetch orders within the date range and specific canteenId
    const orders = await Order.find({
      canteenId:new mongoose.Types.ObjectId(canteenId), // Ensure canteenId is in the query
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "Paid" // Only successful orders
    }).populate('items.productId'); // populate product info for topProduct

    if (!orders.length) {
      return res.json({
        totalRevenue: { value: 0, change: 0 },
        totalOrders: { value: 0, change: 0 },
        avgOrderValue: { value: 0, change: 0 },
        topProduct: { name: "N/A", revenue: 0 },
        trend: [],
        byCategory: []
      });
    }

    // 2. Calculate Total Revenue and Total Orders
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalRevenue / totalOrders;

    // 3. Find Top Product
    const productSalesMap = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId?._id?.toString();
        if (productId) {
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = {
              name: item.productId.name,
              revenue: 0
            };
          }
          productSalesMap[productId].revenue += item.totalPrice;
        }
      });
    });

    let topProduct = { name: "N/A", revenue: 0 };
    for (const productId in productSalesMap) {
      if (productSalesMap[productId].revenue > topProduct.revenue) {
        topProduct = productSalesMap[productId];
      }
    }

    // 4. Sales Trend (Group by date)
    const salesTrendMap = {};

    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]; // format: YYYY-MM-DD
      if (!salesTrendMap[dateKey]) {
        salesTrendMap[dateKey] = 0;
      }
      salesTrendMap[dateKey] += order.totalAmount;
    });

    const trend = Object.keys(salesTrendMap).map(date => ({
      date,
      revenue: salesTrendMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 5. Sales by Category
    const categorySalesMap = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.productId?.category;
        if (category) {
          if (!categorySalesMap[category]) {
            categorySalesMap[category] = 0;
          }
          categorySalesMap[category] += item.totalPrice;
        }
      });
    });

    const byCategory = Object.keys(categorySalesMap).map(category => ({
      category,
      revenue: categorySalesMap[category]
    }));

    // 6. Return the structured response
    res.json({
      totalRevenue: { value: totalRevenue, change: 0 }, // you can later add previous period comparison
      totalOrders: { value: totalOrders, change: 0 },
      avgOrderValue: { value: avgOrderValue, change: 0 },
      topProduct,
      trend,
      byCategory
    });

  } catch (error) {
    console.error("Error in getSalesData:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { getSalesData };
