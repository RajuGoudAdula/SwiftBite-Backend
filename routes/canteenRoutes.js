const express = require('express');
const {} = require('../controllers/canteen/canteenController.js');
const {getMenuItems,getMenuItemById,addMenuItem,updateMenuItem,deleteMenuItem} = require('../controllers/canteen/canteenMenuController.js');
const {getOrders,updateOrderStatus} = require('../controllers/canteen/canteenOrderController.js');
const {} = require('../controllers/canteen/canteenProfileController.js');
const {getReviews,replayReview} = require('../controllers/canteen/canteenReviewController.js');
const {getTodayOrders,getPendingOrders,getTotalRevenue,getPopularItem,getRecentActivity} = require('../controllers/canteen/canteenDashboardController.js');
const { getStats, getChartData, getPieData } = require('../controllers/canteen/canteenAnalyticsController.js');

const authMiddleware = require('../middleware/auth.js');
const router = express.Router();

// Menu Item Routes
router.get("/menu",authMiddleware("canteen"), getMenuItems);
router.get("/menu/:id",authMiddleware("canteen"), getMenuItemById);
router.post("/menu/:canteenId",authMiddleware("canteen"), addMenuItem);
router.put("/menu/:id",authMiddleware("canteen"), updateMenuItem);
router.delete("/menu/:id",authMiddleware("canteen"),deleteMenuItem);

//Orders management
router.get("/:canteenId/orders",authMiddleware("canteen"),getOrders);
router.put("/order/:orderId",authMiddleware("canteen"),updateOrderStatus);

//Reviews 
router.get("/reviews/:canteenId",authMiddleware("canteen"),getReviews);
router.post("/add-replay/:reviewId",authMiddleware("canteen"),replayReview);

//Dashboard
router.get("/orders/today",authMiddleware("canteen"),getTodayOrders);
router.get("/orders/pending",authMiddleware("canteen"),getPendingOrders);
router.get("/revenue/today",authMiddleware("canteen"),getTotalRevenue);
router.get("/menu/popular",authMiddleware("canteen"),getPopularItem);
router.get("/orders/recent",authMiddleware("canteen"),getRecentActivity);

//Analytics
router.get("/analytics/stats",authMiddleware("canteen"),getStats);
router.get("/analytics/chart/:range",authMiddleware("canteen"),getChartData);
router.get("/analytics/pie",authMiddleware("canteen"),getPieData);


module.exports = router;
