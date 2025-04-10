const express = require('express');
const {
  register,
  verifyOTP,
  setPassword,
  login,
  logout,
  verifyUser,
  googleLogin,
  sendotp,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/send-otp',sendotp);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/google-login',googleLogin);
router.get('/verify-user', authMiddleware, verifyUser);

module.exports = router;
