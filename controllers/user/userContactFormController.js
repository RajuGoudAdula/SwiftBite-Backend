const ContactMessage = require('../../models/ContactMessage.js'); 
const { sendContactMessageEmail } = require('../../utils/sendOTP.js');

 exports.submitContactForm = async (req, res) => {
  try {
    const { subject, message, userName, userRole, userEmail } = req.body;
    const { userId } = req.params;


    // ✅ Validate inputs
    if (!subject || !message || !userName || !userRole || !userEmail) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // ✅ Create a new contact message
    const newMessage = new ContactMessage({
      userId,
      name: userName,
      role: userRole,
      email: userEmail,
      subject,
      message,
    });

    // ✅ Save the message in the database
    await newMessage.save();

    // ✅ Send email to admin
    const emailResult = await sendContactMessageEmail({
      userId,
      name: userName,
      role: userRole,
      email: userEmail,
      subject,
      message,
    });

    // ✅ Handle email result
    if (!emailResult.success) {
      console.error("Email Error:", emailResult.error);
      return res.status(500).json({ success: false, message: 'Message saved, but failed to notify admin.' });
    }

    // ✅ Success response
    res.status(201).json({
      success: true,
      message: 'Your message has been submitted successfully and sent to the admin.',
    });

  } catch (error) {
    console.error('Error in contact form submission:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

