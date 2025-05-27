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
    let subject, heading, message;

    // ✅ Determine subject and message content
    if (type === "register") {
      subject = "🔐 Secure Your Registration – OTP Verification";
      heading = "OTP Verification";
      message = "Thank you for registering with SwiftBite! To complete your verification, please use the One-Time Password (OTP) below:";
    } else if (type === "verifyExistingEmail") {
      subject = "🔐 Verify Your Email – OTP for Email Update";
      heading = "Email Update Verification";
      message = "You requested to update your email address. Please verify your identity by using the OTP below:";
    } else if (type === "verifyNewEmail") {
      subject = "🔐 Confirm Your New Email – OTP Verification";
      heading = "Confirm Your New Email";
      message = "You're updating your email address. To confirm your new email, use the OTP below:";
    } else {
      return { success: false, message: "Invalid email type" };
    }

    const htmlContent = `
      <div style="
        font-family:SF Pro Display, SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif;
        max-width: 480px;
        margin: 40px auto;
        padding: 40px;
        background-color: #ffffff;
        border-radius: 18px;
        border: 1px solid #e0e0e0;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
        color: #1d1d1f;
      ">
        <div style="text-align: center;">
          <div style="font-size: 40px; margin-bottom: 16px;">🔐</div>
          <h2 style="margin: 0; font-weight: 600; font-size: 22px;">${heading}</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">Hello,</p>
        
        <p style="font-size: 16px; line-height: 1.6;">${message}</p>

        <div style="
          margin: 30px auto;
          background: #f2f2f7;
          color: #0a84ff;
          padding: 16px 0;
          font-size: 28px;
          font-weight: 600;
          text-align: center;
          border-radius: 12px;
          letter-spacing: 4px;
          max-width: 280px;
        ">
          ${otp}
        </div>

        <p style="font-size: 15px; color: #6e6e73; margin-top: 20px;">
          This code is valid for <strong>5 minutes</strong>. Please do not share it with anyone.
        </p>

        <p style="font-size: 15px; color: #6e6e73;">
          If you didn’t request this, you can safely ignore this message.
        </p>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;" />

        <div style="text-align: center;">
          <p style="font-size: 13px; color: #a1a1a6; margin-bottom: 4px;">SwiftBite Support</p>
          <p style="font-size: 13px; color: #a1a1a6; margin: 0;">© ${new Date().getFullYear()} SwiftBite Inc.</p>
        </div>
      </div>
    `;

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


const sendContactMessageEmail = async (data) => {
  const { name, role, email, subject, message, userId } = data;

  const htmlContent = `
    <div style="background-color: #f6f8fa; padding: 40px 20px;">
      <div style="
        max-width: 600px;
        margin: auto;
        background-color: #ffffff;
        border-radius: 12px;
        padding: 32px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        color: #333;
        border: 1px solid #e1e4e8;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 38px;">📬</div>
          <h2 style="font-size: 22px; margin: 10px 0 0;">New Contact Message</h2>
          <p style="color: #6a737d; font-size: 14px; margin: 4px 0;">From SwiftBite Contact Support</p>
        </div>

        <div style="font-size: 15px; line-height: 1.7; color: #24292e;">
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #0366d6; text-decoration: none;">${email}</a></p>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="
            background: #f1f8ff;
            border-left: 4px solid #2188ff;
            padding: 15px;
            border-radius: 6px;
            font-style: italic;
            color: #24292e;
            white-space: pre-wrap;
            margin-top: 10px;
          ">
            ${message}
          </div>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eaecef;" />

        <div style="text-align: center; font-size: 13px; color: #6a737d;">
          <p>SwiftBite Contact System</p>
          <p>&copy; ${new Date().getFullYear()} SwiftBite Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"SwiftBite Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Message from ${name} [${role}]`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Message sent to admin successfully" };
  } catch (error) {
    return { success: false, message: "Failed to send message", error: error.message };
  }
};

const sendFeedbackResponseEmail = async ({ name, email, subject, originalMessage, adminMessage }) => {
  const htmlContent = `
    <div style="background-color: #f6f8fa; padding: 40px 20px;">
      <div style="
        max-width: 600px;
        margin: auto;
        background-color: #ffffff;
        border-radius: 12px;
        padding: 32px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        color: #333;
        border: 1px solid #e1e4e8;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 38px;">💬</div>
          <h2 style="font-size: 22px; margin: 10px 0 0;">Feedback Response</h2>
          <p style="color: #6a737d; font-size: 14px; margin: 4px 0;">From SwiftBite Admin Team</p>
        </div>

        <div style="font-size: 15px; line-height: 1.7; color: #24292e;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #0366d6; text-decoration: none;">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Your Message:</strong></p>
          <div style="background: #f1f8ff; border-left: 4px solid #0366d6; padding: 15px; border-radius: 6px; white-space: pre-wrap; margin: 10px 0;">
            ${originalMessage}
          </div>

          <p><strong>Admin Response:</strong></p>
          <div style="background: #dcffe4; border-left: 4px solid #28a745; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
            ${adminMessage}
          </div>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eaecef;" />

        <div style="text-align: center; font-size: 13px; color: #6a737d;">
          <p>SwiftBite Feedback System</p>
          <p>&copy; ${new Date().getFullYear()} SwiftBite Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"SwiftBite Feedback" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Admin Response to Your Feedback - ${subject}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Feedback response sent to user successfully" };
  } catch (error) {
    return { success: false, message: "Failed to send feedback response", error: error.message };
  }
};



module.exports = {sendOTP , sendContactMessageEmail , sendFeedbackResponseEmail};
