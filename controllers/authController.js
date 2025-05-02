const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const sendOTP = require('../utils/sendOTP');
const { sendNotification } = require('../services/NotificationService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


// ✅ Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub: googleId, picture } = ticket.getPayload(); // `sub` is Google ID

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if not found
      user = new User({
        name,
        email,
        googleId, // ✅ Store Google ID
        isVerified: true, // ✅ Google users are verified by default
        role: "user", // Default role for new users
      });

      await user.save();
    } else {
      // Populate college & canteen only for existing users
      user = await User.findOne({ email })
        .populate("college", "name")
        .populate("canteen", "name");
    }

    // Generate JWT token
    const jwtToken = generateToken(user);

    res.json({
      success: true,
      message: "Google login successful",
      user: {
        id: user._id,
        email: user.email,
        username:  user.name, // Use name if username is missing
        role: user.role,
        college: user.college || null, // Ensure `null` if not set
        canteen: user.canteen || null, // Ensure `null` if not set
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ success: false, message: "Google login failed" });
  }
};


exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // ✅ Check if User Already Exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already registered.' });
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expire in 5 mins

    if (!user) {
      // ✅ Create a temporary user (with required fields) for OTP storage
      user = new User({
        name: "Temporary", // Provide a default name
        email,
        password: "", // Empty password for temporary users
        otp: { code: otp, expiresAt: otpExpiresAt },
      });
    } else {
      // ✅ Update OTP for existing user
      user.otp = { code: otp, expiresAt: otpExpiresAt };
    }

    await user.save(); // Save user with OTP

    // ✅ Send OTP
    sendOTP(email, otp , "register");

    res.status(200).json({ success: true, message: 'OTP sent successfully to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};


// ✅ Verify OTP (Registration Step 2)
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // ✅ Find User
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // ✅ Check if OTP Expired
    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP Expired' });
    }

    // ✅ Check if OTP is Correct
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ Mark User as Verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.status(200).json({ success : true , message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};


exports.register = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found. Please verify OTP first.' });
    }

    if (!existingUser.isVerified) {
      return res.status(400).json({ message: 'Registration failed. Email not verified.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    existingUser.name = username;
    existingUser.password = hashedPassword;

    await existingUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed. Try again' });
  }
};




// ✅ Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Find User
    const user = await User.findOne({ email })
                .populate("college", "name") 
                .populate("canteen", "name status"); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // ✅ Generate Token
    const token = generateToken(user);

    await sendNotification({
      userId: user._id, // canteen staff userId
      canteenId: user.canteen._id,  // optional, if you're grouping by canteen
      receiverRole: 'canteen',
      title: 'Login Successful',
      message: `Welcome to SwiftBite`,
      type: 'system',
      relatedRef: user._id,
      refModel: 'User',
    });
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        username: user.name,
        role: user.role,
        college: user.college || null,
        canteen: user.canteen || null,
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
};



// ✅ Auto-Login (After Refresh)
exports.verifyUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message : "Verified successfully",
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        college: user.college,
        canteen: user.canteen,
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
