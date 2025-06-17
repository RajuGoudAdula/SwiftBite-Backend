const express = require('express');
const {} = require('../controllers/canteen/canteenController.js');
const {getMenuItems,getMenuItemById,addMenuItem,updateMenuItem,deleteMenuItem, getMenuByCanteen} = require('../controllers/canteen/canteenMenuController.js');
const {getOrders,updateOrderStatus} = require('../controllers/canteen/canteenOrderController.js');
const {} = require('../controllers/canteen/canteenProfileController.js');
const {getAllReviewsForCanteen, respondToReview, getCanteenFeedbacks, deleteReview} = require('../controllers/canteen/canteenReviewController.js');
const {getTodayOrders,getPendingOrders,getTotalRevenue,getPopularItem,getRecentActivity, toggleCanteen, getCanteenStatus} = require('../controllers/canteen/canteenDashboardController.js');
const { getSalesData } = require('../controllers/canteen/canteenSalesDataController.js');
const { getUserStatistics } = require('../controllers/canteen/canteenUserDataController.js');
const { getCanteenProductStats } = require('../controllers/canteen/canteenProductDataController.js');


const authMiddleware = require('../middleware/auth.js');
const router = express.Router();

// Menu Item Routes
router.get("/menu/:canteenId",authMiddleware("canteen"), getMenuItems);
router.get("/menu/:id",authMiddleware("canteen"), getMenuItemById);
router.post("/menu/:canteenId",authMiddleware("canteen"), addMenuItem);
router.put("/menu/:id",authMiddleware("canteen"), updateMenuItem);
router.delete("/menu/:id",authMiddleware("canteen"),deleteMenuItem);

//Orders management
router.get("/:canteenId/orders",authMiddleware("canteen"),getOrders);
router.put("/order/:orderId",authMiddleware("canteen"),updateOrderStatus);

//Reviews 
router.post('/:canteenId/add-response',authMiddleware("canteen"),respondToReview);
router.get('/:canteenId',authMiddleware("canteen"),getCanteenFeedbacks);
router.delete('/:canteenId/delete-review/:reviewId/:userId/:productId/:orderId',authMiddleware("canteen"),deleteReview);

//Dashboard
router.get("/orders/:canteenId/today",authMiddleware("canteen"),getTodayOrders);
router.get("/orders/:canteenId/pending",authMiddleware("canteen"),getPendingOrders);
router.get("/revenue/:canteenId/today",authMiddleware("canteen"),getTotalRevenue);
router.get("/menu/popular",authMiddleware("canteen"),getPopularItem);
router.get("/orders/:canteenId/recent",authMiddleware("canteen"),getRecentActivity);
router.put("/:canteenId/update-canteen",authMiddleware("canteen"),toggleCanteen);
router.get("/:canteenId/canteen-status",authMiddleware("canteen"),getCanteenStatus);

//Analytics Sales Data
router.get('/:canteenId/analytics/sales-data',authMiddleware("canteen"),getSalesData)
router.get('/:canteenId/analytics/user-data',authMiddleware("canteen"),getUserStatistics);
router.get('/:canteenId/analytics/product-data',authMiddleware("canteen"),getCanteenProductStats)
router.get(`/:canteenId/analytics/reviews-data`,authMiddleware("canteen"),getAllReviewsForCanteen);

module.exports = router;
