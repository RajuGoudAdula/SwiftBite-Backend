const { sendNotification } = require("../../utils/notificationUtils");

/**
 * @desc Send push notification
 * @route POST /api/notifications/send
 * @access Private (Admin or Authorized Users)
 */
 exports.sendNotificationController = async (req, res) => {
  try {
    const { title, message, userIds } = req.body;

    // Validate request body
    if (!title || !message || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Invalid request. Provide title, message, and at least one userId." });
    }

    // Send notification using OneSignal
    const response = await sendNotification(title, message, userIds);

    res.status(200).json({ success: true, message: "Notification sent successfully", response });
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
};
