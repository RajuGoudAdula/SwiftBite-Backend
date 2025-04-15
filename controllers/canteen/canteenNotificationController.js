const Notification = require('../../models/CanteenNotification');

// Create a notification for a canteen
exports.createNotification = async ({ canteenId, message, relatedRef = null, refModel = null }) => {
  try {
    const notification = new Notification({
      canteenId,
      message,
      relatedRef,
      refModel,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating canteen notification:', err.message);
    throw err;
  }
};

// Get all notifications for a canteen
exports.getCanteenNotifications = async (req, res) => {
  try {
    const canteenId = req.canteen._id; // Make sure your middleware sets this
    const notifications = await Notification.find({ canteenId }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read', data: notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const canteenId = req.canteen._id;
    await Notification.updateMany({ canteenId, isRead: false }, { $set: { isRead: true } });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// Delete a single notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Clear all notifications for a canteen
exports.clearAllNotifications = async (req, res) => {
  try {
    const canteenId = req.canteen._id;
    await Notification.deleteMany({ canteenId });

    res.status(200).json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
};
