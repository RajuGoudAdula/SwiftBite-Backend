const User = require('../models/User.js');

class NotificationService {
  // Send a notification to a specific user
  static async send(userId, message) {
    console.log(`📩 Notification sent to user ${userId}: ${message}`);
  }

  // Broadcast a notification to all users of a specific college
  static async broadcast(collegeId, title, message) {
    try {
      const users = await User.find({ collegeId });

      if (!users.length) {
        console.log(`No users found for college ID: ${collegeId}`);
        return;
      }

      users.forEach(user => {
        console.log(`📩 Broadcast to ${user._id}: ${title} - ${message}`);
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
    }
  }
}

module.exports = NotificationService; // ✅ Use CommonJS export
