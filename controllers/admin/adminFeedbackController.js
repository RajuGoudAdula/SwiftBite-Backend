const Feedback = require('../../models/Feedback');
const { sendFeedbackResponseEmail } = require('../../utils/sendOTP');

exports.getAllFeedbacks = async (req, res) => {
    try {
      const feedbacks = await Feedback.find().sort({ createdAt: -1 });
      res.status(200).json(feedbacks);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

exports.sendFeedbackResponse = async (req, res) => {
    const { feedbackId } = req.params;
    const { type, message } = req.body;
  
    if (!['user', 'canteen'].includes(type)) {
      return res.status(400).json({ message: 'Invalid response type' });
    }
  
    try {
      const feedback = await Feedback.findById(feedbackId);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      if(type === "user"){
        feedback.userResponseAdmin = message;
        await sendFeedbackResponseEmail({
            name: feedback.userName,
            email: feedback.email,
            subject: feedback.subject,
            originalMessage: feedback.message,
            adminMessage: message,
          });
      }else{
        feedback.canteenResponseAdmin = message;
      }
      await feedback.save();
  
      res.status(200).json({ message: `Response sent to ${type} successfully`, updated: feedback });
    } catch (error) {
      console.error('Error sending response:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };