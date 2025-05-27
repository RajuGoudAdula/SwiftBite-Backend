const { json } = require('body-parser');
const bcrypt = require("bcryptjs");
const User = require('../../models/User');
const {sendOTP} = require('../../utils/sendOTP');

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

exports.sendEmailOtp = async (req,res) => {
  const {userId} =req.params;
  const {email} = req.body;
 console.log(req.body,userId);
 try {
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }
  if (!userId) {
    return res.status(400).json({ message: "UserId is required." });
  }

  // ✅ Check if User Already Exists
  let user = await User.findById(userId);
 console.log(user);
  if (!user) {
    return res.status(400).json({ message: 'User not found. Please register' });
  }

  // ✅ Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expire in 5 mins

  
  user.otp = { code: otp, expiresAt: otpExpiresAt };
  if(user.email !== email){
    user.email = email;
    await user.save();
    res.status(200).json(sendOTP(email, otp , "verifyExistingEmail"));

  }else{
    await user.save();
    res.status(200).json(sendOTP(email, otp , "verifyNewEmail"));
  }

 }catch(error){
  console.log(error);
  res.status(500).json({ message: 'Failed to send email OTP' });
 }
};


exports.verifyEmailOtp = async (req,res) => {
  const {email,otp} = req.body;
  console.log(req.body);
  try{
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    // ✅ Check if User Already Exists
    let user = await User.findOne({ email });
  
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please register' });
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

  }catch(error){
    res.status(500),json({success : false,message : "Failed to verify email OTP"});
  }
}



exports.verifyPassword = async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    res.status(200).json({ success: true, message: "Password verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.updatePassword = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
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