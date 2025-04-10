const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Create a reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // ✅ Uses environment variable
    pass: process.env.EMAIL_PASS, // ✅ Should be an App Password (not your Gmail password)
  },
});

// ✅ Function to send OTP for different purposes
const sendOTP = async (email, otp, type) => {
  try {
    let subject, htmlContent;

    // ✅ Different email templates based on type
    if (type === "register") {
      subject = "🔐 Secure Your Registration – OTP Verification";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto; background-color: #f9f9f9;">
          <h3>🔐 OTP Verification</h3>
          <p>Dear User,</p>
          <p>Thank you for registering with SwiftBite! To complete your verification, please use the One-Time Password (OTP) below:</p>
          <p style="font-size: 20px; font-weight: bold; color: #007bff;">Your OTP: <strong>${otp}</strong></p>
          <p>This OTP is valid for the next <strong>5 minutes</strong>. Please do not share it with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p style="font-size: 12px; color: #777; margin-top: 15px;">Best regards,<br><strong>SwiftBite Support Team</strong></p>
        </div>
      `;
    } else if (type === "verifyExistingEmail") {
      subject = "🔐 Verify Your Email – OTP for Email Update";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto; background-color: #f9f9f9;">
          <h3>🔐 Email Update Verification</h3>
          <p>Dear User,</p>
          <p>You requested to update your email address. Before proceeding, please verify your identity by entering the OTP below:</p>
          <p style="font-size: 20px; font-weight: bold; color: #007bff;">Your OTP: <strong>${otp}</strong></p>
          <p>This OTP is valid for <strong>5 minutes</strong>. Do not share this OTP with anyone.</p>
          <p>If you did not request this change, please ignore this email.</p>
          <p style="font-size: 12px; color: #777; margin-top: 15px;">Best regards,<br><strong>SwiftBite Support Team</strong></p>
        </div>
      `;
    } else if (type === "verifyNewEmail") {
      subject = "🔐 Confirm Your New Email – OTP Verification";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto; background-color: #f9f9f9;">
          <h3>🔐 Confirm Your New Email</h3>
          <p>Dear User,</p>
          <p>You are updating your email to this new address. Please verify your new email by entering the OTP below:</p>
          <p style="font-size: 20px; font-weight: bold; color: #007bff;">Your OTP: <strong>${otp}</strong></p>
          <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it.</p>
          <p>If you did not request this change, please ignore this email.</p>
          <p style="font-size: 12px; color: #777; margin-top: 15px;">Best regards,<br><strong>SwiftBite Support Team</strong></p>
        </div>
      `;
    } else {
      return { success: false, message: "Invalid email type" };
    }

    const mailOptions = {
      from: `"SwiftBite Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    return { success: false, message: "Failed to send OTP", error: error.message };
  }
};

module.exports = sendOTP;
