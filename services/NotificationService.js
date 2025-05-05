const Notification = require('../models/Notification');

const sendNotification = async ({
  userId,
  message,
  title = '',
  receiverRole,
  toAll = false,
  type = 'system',
  relatedRef = null,
  refModel = null,
  canteenId = null,
}) => {
  try {
    // If userId is an array, process each userId
    if (Array.isArray(userId)) {
      userId.forEach(async (uid) => {
        const notification = new Notification({
          userId: uid,
          message,
          title,
          receiverRole,
          toAll,
          type,
          relatedRef,
          refModel,
          canteenId,
        });

        // Save the notification to the database
        const res = await notification.save();

        // Real-time emit logic for each user
        if (global.connectedUsers?.[uid]) {
          const socketIds = global.connectedUsers[uid]; // List of socket IDs for the user
          socketIds.forEach((socketId) => {
            global.io.to(socketId).emit('new_notification', notification);
          });
        }
      });
      return;
    }

    // If userId is not an array, process a single userId
    const notification = new Notification({
      userId,
      message,
      title,
      receiverRole,
      toAll,
      type,
      relatedRef,
      refModel,
      canteenId,
    });

    // Save the notification to the database
    await notification.save();

    // Real-time emit logic
    if (toAll && receiverRole) {
      // Broadcast to all connected users of a specific role
      for (let [uid, socketIds] of Object.entries(global.connectedUsers || {})) {
        const userInfo = global.userDetails?.[uid];
        if (userInfo?.role === receiverRole) {
          socketIds.forEach((socketId) => {
            global.io.to(socketId).emit('new_notification', notification);
          });
        }
      }
    } else if (userId && global.connectedUsers?.[userId]) {
      // Send to the specific user if they are connected
      const socketIds = global.connectedUsers[userId];
      socketIds.forEach((socketId) => {
        global.io.to(socketId).emit('new_notification', notification);
      });
    }

  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

const sendUsersAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const allUserNotifications = await Notification.find({
      userId: userId
    }).sort({ createdAt: -1 });

    if (!allUserNotifications) {
      return res.status(404).json({ message: 'Notifications not found' });
    }

    res.status(200).json({ message: 'All notifications', notifications: allUserNotifications });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching all notifications', error: error.message });
  }
};

// Mark a single notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', notification: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error marking as read', error: error.message });
  }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

// Delete all notifications of a user
const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      message: 'All notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing notifications', error: error.message });
  }
};

module.exports = {
  sendNotification,
  sendUsersAllNotifications,
  markNotificationAsRead,
  deleteAllNotifications,
  deleteNotification
};
