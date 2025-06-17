const express = require('express');
const authMiddleware = require('../middleware/auth');

const {getAllColleges,getCanteensByCollege,updateCollegeCanteen,getMenuOfCanteen, fetchCanteenStatus,} = require('../controllers/user/userCollegeController');

const {getUserCart,addToCart,updateCartItem,removeFromCart,clearCart,getItemDetails, checkStock} = require('../controllers/user/userCartController');
const { createOrder, paymentWebhook, getPaymentStatus } = require("../controllers/user/userPaymentController");
const {getUserOrders,cancelOrder} = require('../controllers/user/userOrderController');
const {getProfile,sendEmailOtp,verifyEmailOtp , verifyPassword,updatePassword,updateUsername} =require('../controllers/user/userProfileController');
const {addReview,updateReview,deleteReview,getUserReview,likeReview,disLikeReview, sendCanteenFeedback} = require('../controllers/user/userReviewController');
const { fetchPopularItems, debouncedSearch } = require('../controllers/user/userSearchController');
const {addFavouriteItem,removeFavouriteItem,getFavouriteItems} = require('../controllers/user/userFavouriteItemsController');
const { submitContactForm } = require('../controllers/user/userContactFormController');
const { getHeroBanners } = require('../controllers/user/userHeroBannerController');


const router = express.Router();

router.get('/colleges',getAllColleges);
router.get('/colleges/:collegeId/canteens',getCanteensByCollege);
router.put('/update-college-canteen/:userId',updateCollegeCanteen);
router.get('/:canteenId/menu',getMenuOfCanteen);
router.get('/fetch-canteen-status/:canteenId',fetchCanteenStatus);


router.get('/cart/fetch-cart/:userId',authMiddleware("user"),getUserCart);
router.post('/cart/add-to-cart/:userId',authMiddleware("user"),addToCart);
router.put('/cart/update-quantity/:userId',authMiddleware("user"),updateCartItem);
router.delete('/cart/remove-item/:userId/:itemId',authMiddleware("user"),removeFromCart);
router.get('/cart/check-stock/:userId',authMiddleware("user"),checkStock);

router.get('/get-item-details/:itemId',authMiddleware("user"),getItemDetails);
router.post('/like-review/:itemId/:reviewId',authMiddleware("user"),likeReview);
router.post('/disLike-review/:itemId/:reviewId',authMiddleware("user"),disLikeReview);



router.post('/payment/get-session-id/:userId',authMiddleware("user"),createOrder);
router.post('/payment/webhook',paymentWebhook);
router.get('/payment/status/:orderId',authMiddleware("user"),getPaymentStatus);


router.get('/orders/:userId/:canteenId',authMiddleware("user"),getUserOrders);
router.put('/cancel-order/:orderId', authMiddleware("user") , cancelOrder);


router.get('/profile/:userId',authMiddleware("user"),getProfile);
router.put('/profile/:userId',authMiddleware("user"),updateUsername);
router.post('/profile/send-email-otp/:userId',authMiddleware("user"),sendEmailOtp);
router.post('/profile/verify-email-otp',authMiddleware("user"),verifyEmailOtp);
router.post('/profile/verify-password/:userId',authMiddleware("user"),verifyPassword);
router.put('/profile/update-password/:userId',authMiddleware("user"),updatePassword);


router.post('/add-review/:productId',authMiddleware("user"),addReview);
router.put('/update-review/:productId/:orderId',authMiddleware("user"),updateReview);
router.delete('/delete-review/:productId/:orderId',authMiddleware("user"),deleteReview);
router.get('/fetch-user-review/:orderId/:userId',authMiddleware("user"),getUserReview);
router.post('/:userId/feedback/:canteenId',authMiddleware("user"),sendCanteenFeedback);

router.get('/menu/popular',fetchPopularItems);
router.get('/menu/:canteenId/search',debouncedSearch);

router.post('/add-favourite-item/:userId/:canteenId',authMiddleware("user"),addFavouriteItem);
router.delete('/remove-favourite-item/:userId/:canteenId/:itemId',authMiddleware("user"),removeFavouriteItem);
router.get('/fetch-favourite-items/:userId',authMiddleware("user"),getFavouriteItems);

router.post('/:userId/contact-message',authMiddleware("user"),submitContactForm);

router.get('/get-herobanners/:userId/:canteenId',authMiddleware("user"),getHeroBanners);
module.exports = router;