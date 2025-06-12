const argon2 = require('argon2');
const User = require('../../models/User');
const {sendOTP} = require('../../utils/sendOTP');
const OtpStore = require('../../models/OtpStore');

// ✅ Get User Profile (Excluding Sensitive Data)
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user and exclude sensitive fields
    const user = await User.findById(userId).select("-password -otp -__v -role -createdAt -updatedAt -isVerified -orders")
                            .populate("college", "name") 
                            .populate("canteen", "name"); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Update Profile (Request OTP)
exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ✅ Update OTP in User Schema
    user.otp.code = otp;
    user.otp.expiresAt = otpExpiresAt;
    await user.save();

    // ✅ Send OTP to Email/Phone
    if (email && email !== user.email) {
      await sendOTP(email, otp);
    } else if (phone && phone !== user.phone) {
      await sendOTP(phone, otp);
    }

    res.status(200).json({ message: 'OTP sent successfully. Verify to update profile.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// ✅ Verify OTP & Update Profile
exports.verifyOTP = async (req, res) => {
  const { email, phone, otp } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Check if OTP is valid
    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please try again.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ Update Email or Phone after OTP verification
    if (email && email !== user.email) user.email = email;
    if (phone && phone !== user.phone) user.phone = phone;

    // ✅ Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

exports.sendEmailOtp = async (req, res) => {
  const { userId } = req.params;
  const { email } = req.body;

  if (!email || !userId) {
    return res.status(400).json({ message: "Email and userId are required." });
  }

  try {
    // ✅ Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register." });
    }

    // ✅ Find existing OTP document for this email
    let userOtp = await OtpStore.findOne({ email });

    // ✅ Generate new OTP and expiration
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    if (!userOtp) {
      userOtp = new OtpStore({
        email,
        code: otpCode,
        purpose: "verify-email",
        expiresAt,
        verified: false,
      });
    } else {
      userOtp.code = otpCode;
      userOtp.purpose = "verify-email";
      userOtp.expiresAt = expiresAt;
      userOtp.verified = false;
    }

    await userOtp.save();

    // ✅ Send OTP
    const emailPurpose = user.email === email ? "verifyExistingEmail" : "verifyNewEmail";
    await sendOTP(email, otpCode, emailPurpose);

    res.status(200).json({ success: true, message: "OTP sent successfully." });

  } catch (error) {
    console.error("sendEmailOtp error:", error);
    res.status(500).json({ message: "Failed to send email OTP" });
  }
};


exports.verifyEmailOtp = async (req, res) => {
  const { oldEmail,newEmail, otp } = req.body;

  if (!oldEmail || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    // Step 1: Check if user exists
    const user = await User.findOne({ email : oldEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register." });
    }

    // Step 2: Get OTP from OtpStore
    let otpDoc;
    if(newEmail){
      otpDoc = await OtpStore.findOne({email : newEmail , purpose : "verify-email"});
    }else{
      otpDoc = await OtpStore.findOne({ email : oldEmail, purpose: "verify-email" });
    }

    if (!otpDoc) {
      return res.status(404).json({ message: "OTP not found. Please request a new one." });
    }

    // Step 3: Check OTP expiry
    if (otpDoc.expiresAt < Date.now()) {
      await OtpStore.deleteOne({ _id: otpDoc._id }); // Clean up expired OTP
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // Step 4: Validate OTP
    if (otpDoc.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Step 5: Mark OTP as verified and update user
    user.isVerified = true;
    if(newEmail){
      user.email = newEmail;
    }
    await user.save();

    otpDoc.verified = true;
    await otpDoc.save();

    res.status(200).json({ success: true, message: "OTP verified successfully." });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Failed to verify email OTP." });
  }
};



exports.verifyPassword = async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  try {

    if(!password){
      return res.status(400).json({success : false , message : "Old Password is required"});
    }
    // Find the user by ID
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Compare entered password with stored hashed password
    const isMatch = await argon2.verify(user.password , password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    res.status(200).json({ success: true, message: "Password verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.updatePassword = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    if(!oldPassword || !newPassword){
      return res.status(400).json({success : false , message : "Password required"});
    }
    // Fetch the user from the database
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

   // Verify old password
    const isMatch = await argon2.verify(user.password, oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    // Hash the new password
    const hashedPassword = await argon2.hash(newPassword);

    // Update password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({success : true , message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUsername = async (req,res) =>{
  const {userId} = req.params;
  const {name } = req.body;
  try{
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.name=name;
    await user.save();
    res.status(200).json({ message: "Username updated successfully" });

  }catch(error){
    res.status(500).json({ message: "Server error", error: error.message });
  }
}