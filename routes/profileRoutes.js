const express = require('express');
const userProfileController = require('../controllers/user/userProfileController');
const canteenProfileController = require('../controllers/canteen/canteenProfileController');
const adminProfileController = require('../controllers/admin/adminProfileController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ✅ User Profile Routes
router.get('/user', authMiddleware("user"), userProfileController.getProfile);
router.put('/user/update', authMiddleware("user"), userProfileController.updateProfile);
router.post('/user/verify-otp', authMiddleware("user"), userProfileController.verifyOTP);

// ✅ Canteen Profile Routes
router.get('/canteen', authMiddleware("canteen"), canteenProfileController.getCanteenProfile);
router.get('/canteen/update', authMiddleware("canteen"), canteenProfileController.updateCanteenProfile);
router.get('/canteen/verify-otp', authMiddleware("canteen"), canteenProfileController.verifyOTP);


// ✅ Admin Profile Routes
router.get('/admin/users', authMiddleware("admin"), adminProfileController.getAllUsers);
router.get('/admin/canteens',authMiddleware("admin"),adminProfileController.getAllCanteens);
router.delete('/admin/user/:id', authMiddleware("admin"), adminProfileController.deleteUser);

module.exports = router;
