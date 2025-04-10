const Order = require('../../models/Order');  // Replace with your Order model path
const User = require('../../models/User');    // Replace with your User model path
const moment = require('moment');



exports.getStats = async (req, res) => {
  try {
    // Define date ranges
    const now = new Date();
    const lastWeek = moment().subtract(1, 'week').toDate();
    const twoWeeksAgo = moment().subtract(2, 'week').toDate();

    // Current week stats
    const totalOrders = await Order.countDocuments({ createdAt: { $gte: lastWeek } });
    const revenueResult = await Order.aggregate([
      { $match: { createdAt: { $gte: lastWeek } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const activeUsers = await User.countDocuments({ isActive: true });

    // Previous week stats for comparison
    const prevOrders = await Order.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: lastWeek } });
    const prevRevenueResult = await Order.aggregate([
      { $match: { createdAt: { $gte: twoWeeksAgo, $lt: lastWeek } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const prevRevenue = prevRevenueResult[0]?.total || 0;

    const calculateChange = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return Math.round(((current - previous) / previous) * 100);
    };

    const stats = [
      {
        label: 'Total Orders',
        value: totalOrders,
        change: calculateChange(totalOrders, prevOrders),
      },
      {
        label: 'Total Revenue',
        value: totalRevenue,
        change: calculateChange(totalRevenue, prevRevenue),
      },
      {
        label: 'Active Users',
        value: activeUsers,
        change: null, // This can be calculated using login activity data
      },
      {
        label: 'Conversion Rate',
        value: '3.2%',
        change: -2, // Placeholder unless you implement conversion tracking
      },
    ];

    res.status(200).json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};


// 2. Get Chart Data
exports.getChartData = async (req, res) => {
  try {
    const { range } = req.params;

    let groupByFormat;
    switch (range) {
      case 'day':
        groupByFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupByFormat = '%Y-%U'; // Year-Week
        break;
      case 'month':
        groupByFormat = '%Y-%m';
        break;
      case 'year':
        groupByFormat = '%Y';
        break;
      default:
        groupByFormat = '%Y-%m-%d';
    }

    const chartData = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: groupByFormat, date: "$createdAt" }
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          name: "$_id",
          orders: 1,
          revenue: 1,
          _id: 0,
        }
      }
    ]);

    // Optional: add fake "users" data
    const dataWithUsers = chartData.map(item => ({
      ...item,
      users: Math.floor(Math.random() * 100) + 10
    }));

    res.status(200).json(dataWithUsers);
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
};

// 3. Get Pie Data
exports.getPieData = async (req, res) => {
  try {
    // Fake data for traffic sources
    const pieData = [
      { name: 'Mobile App', value: 45 },
      { name: 'Website', value: 30 },
      { name: 'QR Orders', value: 20 },
      { name: 'Other', value: 5 },
    ];
    res.status(200).json(pieData);
  } catch (err) {
    console.error('Pie data error:', err);
    res.status(500).json({ message: 'Error fetching pie chart data' });
  }
};
