const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const mongoose = require("mongoose");
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const {sendOTP} = require('../utils/sendOTP');
const { sendNotification } = require('../services/NotificationService');
const OtpStore = require('../models/OtpStore');
const sendWebPushNotification = require('../utils/sendWebPushNotification');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "994958748375-d0saihca1d65bu4l37fukgn74ngtivff.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
   
    const { email, name, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email not available from Google" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not exists
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
        role: "user",
      });
    }

    // Populate only if user exists (not during creation)
    if (user.college || user.canteen) {
      await user.populate("college", "name");
      await user.populate("canteen", "name");
    }

    const jwtToken = generateToken(user);

    res.json({
      success: true,
      message: "Google login successful",
      user: {
        id: user._id,
        email: user.email,
        username: user.name,
        role: user.role,
        college: user.college || null,
        canteen: user.canteen || null,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error("❌ Google Login Error:", error.message);
    res.status(500).json({ success: false, message: "Google login failed" });
  }
};




exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Check if user already registered
    const userExists = await User.findOne({ email: normalizedEmail }).select('isVerified password');

    if (userExists && userExists?.isVerified && userExists?.password) {
      return res.status(400).json({ message: "User already registered." });
    }

    // ✅ Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // ✅ Upsert OTP document
    await OtpStore.findOneAndUpdate(
      { email: normalizedEmail, purpose: "register" },
      {
        code: otpCode,
        purpose: "register",
        expiresAt: otpExpiresAt,
        verified: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ✅ Send OTP
    await sendOTP(normalizedEmail, otpCode, "register");

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("OTP Sending Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};



exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;


  if (!email || !otp ) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Get OTP record inside session
    const otpEntry = await OtpStore.findOne({ email, purpose : "register" }).session(session);

    if (!otpEntry) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "OTP not found. Please request a new one." });
    }

    // ✅ Check OTP expiration
    if (otpEntry.expiresAt < Date.now()) {
      await OtpStore.deleteOne({ _id: otpEntry._id }).session(session);
      await session.commitTransaction();
      session.endSession();
      return res.status(410).json({ message: "OTP expired. Please request a new one." });
    }

    // ✅ Check OTP code
    if (otpEntry.code !== otp) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: "Invalid OTP. Please try again." });
    }

    // ✅ Handle "register" purpose
      let user = await User.findOne({ email }).session(session);

      if (user && user.isVerified && user?.password) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Email already verified. Please login." });
      }

      if (!user) {
        // 👤 Create user only after OTP is verified
        user = new User({
          name: otpEntry.name || "User",
          email,
          isVerified: true,
          role: "user",
        });

        await user.save({ session });
      } else {
        user.isVerified = true;
        await user.save({ session });
      }

    // ✅ Delete OTP after successful flow
    await OtpStore.deleteOne({ _id: otpEntry._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "OTP verified and registration complete.",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ OTP Verification Transaction Error:", error);
    return res.status(500).json({ message: "Verification failed. Please try again later." });
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

    const hashedPassword = await argon2.hash(password, 10);

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
    const user = await User.findOne({ email })
      .select("+password googleId name email role")
      .populate("college", "name")
      .populate("canteen", "name status _id")
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (password && user?.googleId) {
      await sendWebPushNotification(user._id, {
        title: 'Login Failed',
        body: 'You signed in using Google. Please use Google Sign-In.'
      });
      return res.status(403).json({ message: 'You signed in with Google. Use Google to log in.' });
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      await sendWebPushNotification(user._id, {
        title: 'Login Failed',
        body: 'Invalid email or password.'
      });
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = generateToken(user);

    // Optional: call internal logic
    sendNotification({
      userId: user._id,
      canteenId: user?.canteen?._id,
      receiverRole: 'canteen',
      title: 'Login Successful',
      message: `Welcome to SwiftBite`,
      type: 'system',
      relatedRef: user._id,
      refModel: 'User',
    });

    // ✅ Send push notification on successful login
    await sendWebPushNotification(user._id, {
      title: 'Login Successful',
      body: `Welcome back, ${user.name}!`
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
    console.log(error);
    res.status(500).json({ message: 'Login failed' });
  }
};




// ✅ Auto-Login (After Refresh)
exports.verifyUser = async (req, res) => {
  try {
    let token = req.headers.authorization.split(' ')[1];
    token = token.substring(1,token.length-1);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
                            .populate("college", "name") 
                            .populate("canteen", "name status");

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
        college: user.college || null,
        canteen: user.canteen || null,
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
