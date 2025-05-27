const express = require('express');

const {getCanteensByCollege,deleteCanteen,updateCanteen,createCanteen} = require('../controllers/admin/adminCanteenController.js');
const {getAllColleges,deleteCollege,createCollege,updateCollege} = require('../controllers/admin/adminCollegeController.js');
const { getAdminStats, getRecentActivity, getTodaysOrders } = require('../controllers/admin/adminDashboardController.js');
const {} = require('../controllers/admin/adminOrderController.js');
const {} = require('../controllers/admin/adminPaymentController.js');
const {} = require('../controllers/admin/adminProfileController.js');
const {} = require('../controllers/admin/adminReviewController.js');
const {  deleteUserByAdmin, getAllUsersForAdmin } = require('../controllers/admin/adminUserController.js');
const {getAllProducts,getProductById,addProduct,updateProduct,deleteProduct} = require('../controllers/admin/adminProductsController.js');
const { getAllBanners, updateBanner, deleteBanner, addHeroBanner, fetchCanteens } = require('../controllers/admin/adminBannerController.js');
const { getAllFeedbacks, sendFeedbackResponse } = require('../controllers/admin/adminFeedbackController.js');


const authMiddleware = require('../middleware/auth.js');
const router = express.Router();

//For colleges
router.get('/colleges',getAllColleges);
router.post('/colleges',authMiddleware("admin"),createCollege);
router.put('/colleges/:collegeId',authMiddleware("admin"),updateCollege);
router.delete('/colleges/:collegeId',authMiddleware("admin"),deleteCollege);



//For canteens
router.post('/colleges/:collegeId/canteens',authMiddleware("admin"),createCanteen);
router.get('/colleges/:collegeId/canteens',getCanteensByCollege);
router.put('/colleges/:collegeId/canteens/:canteenId',authMiddleware("admin"),updateCanteen);
router.delete('/colleges/:collegeId/canteens/:canteenId',authMiddleware("admin"),deleteCanteen);


//For Products
router.get('/products',getAllProducts);
router.get('/products/:productId',authMiddleware("admin"),getProductById);
router.post('/products/new-product',authMiddleware("admin"),addProduct);
router.put('/products/:productId',authMiddleware("admin"),updateProduct);
router.delete('/products/:productId',authMiddleware("admin"),deleteProduct);

//Banners
router.get('/banners',getAllBanners);
router.put('/update-banner/:bannerId',authMiddleware("admin"),updateBanner);
router.post('/post-banner',authMiddleware("admin"),addHeroBanner);
router.delete('/delete-banner/:bannerId',authMiddleware("admin"),deleteBanner);
router.get('/fetchCanteens',authMiddleware("admin"),fetchCanteens);

//Dashboard
router.get('/get-stats',authMiddleware("admin"),getAdminStats);
router.get('/get-activity',authMiddleware("admin"),getRecentActivity);
router.get('/get-todays-orders',authMiddleware("admin"),getTodaysOrders);

//User management
router.get('/get-all-users',authMiddleware("admin"),getAllUsersForAdmin);
router.delete('/delete/user/:userId',authMiddleware("admin"),deleteUserByAdmin);

//Feedbacks
router.get('/get-feedbacks',authMiddleware("admin"),getAllFeedbacks);
router.put('/send-feedback/:feedbackId',authMiddleware("admin"),sendFeedbackResponse);

module.exports = router;