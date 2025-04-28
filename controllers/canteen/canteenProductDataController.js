const Product = require('../../models/Product');
const Review = require('../../models/Review');
const Order = require('../../models/Order');
const CanteenMenuItem = require('../../models/CanteenMenuItem');

exports.getCanteenProductStats = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // 1. Total Products in the Canteen
    const totalProducts = await CanteenMenuItem.countDocuments({ canteenId });

    // 2. Fetch orders in date range
    const orders = await Order.find({
      canteenId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'Paid' // Only count paid orders
    });

    let totalProductsSold = 0;
    let topSellingData = [];
    let performanceData = [];
    let revenueByProduct = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId.toString();
        const quantity = item.quantity || 0;
        const revenue = item.totalPrice || 0;

        // Update totals
        totalProductsSold += quantity;

        if (!revenueByProduct[productId]) {
          revenueByProduct[productId] = {
            orders: 0,
            revenue: 0
          };
        }

        revenueByProduct[productId].orders += quantity;
        revenueByProduct[productId].revenue += revenue;
      });
    });

    // Fetch product names from CanteenMenuItem
    const productIds = Object.keys(revenueByProduct);
    const products = await CanteenMenuItem.find({ productId: { $in: productIds }, canteenId });

    let topProduct = null;
    let topRevenue = 0;

    products.forEach(product => {
      const productId = product.productId.toString();
      const productData = revenueByProduct[productId];

      if (productData) {
        topSellingData.push({
          name: product.name,
          orders: productData.orders
        });

        performanceData.push({
          name: product.name,
          orders: productData.orders,
          revenue: productData.revenue
        });

        if (productData.revenue > topRevenue) {
          topRevenue = productData.revenue;
          topProduct = product;
        }
      }
    });

    // Sort Top Selling Products
    topSellingData.sort((a, b) => b.orders - a.orders);
    const topSelling = topSellingData.slice(0, 5);

    // 3. Average Rating for products
    const reviews = await Review.find({ productId: { $in: productIds } });

    let totalRating = 0;
    let totalReviewCount = 0;

    reviews.forEach(reviewDoc => {
      reviewDoc.reviews.forEach(singleReview => {
        totalRating += singleReview.rating;
        totalReviewCount++;
      });
    });

    const avgRating = totalReviewCount > 0 ? (totalRating / totalReviewCount) : 0;

    res.status(200).json({
      totalProducts: {
        value: totalProducts,
        change: null // optional: you can calculate growth later
      },
      productsSold: {
        value: totalProductsSold,
        change: null
      },
      topProductRevenue: {
        value: topRevenue,
        change: null
      },
      avgRating: {
        value: avgRating.toFixed(2),
        change: null
      },
      topSelling,
      performance: performanceData
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
