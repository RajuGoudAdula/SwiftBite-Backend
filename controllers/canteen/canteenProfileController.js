const User = require('../../models/User');
const sendOTP = require('../../utils/sendOTP');

// ✅ Get Canteen Profile
exports.getCanteenProfile = async (req, res) => {
  try {
    const canteen = await User.findById(req.user.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    res.status(200).json({ canteen });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Update Canteen Profile (Request OTP)
exports.updateCanteenProfile = async (req, res) => {
  const { email, phone } = req.body;

  try {
    const canteen = await User.findById(req.user.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ✅ Save OTP in Database
    canteen.otp.code = otp;
    canteen.otp.expiresAt = otpExpiresAt;
    await canteen.save();

    // ✅ Send OTP
    await sendOTP(email || phone, otp);

    res.status(200).json({ message: 'OTP sent. Verify to update profile.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// ✅ Verify OTP for Canteen
exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;

  try {
    const canteen = await User.findById(req.user.id);

    if (canteen.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP Expired' });
    }

    if (canteen.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ Update Profile
    canteen.otp = undefined;
    await canteen.save();

    res.status(200).json({ message: 'Canteen profile updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};
