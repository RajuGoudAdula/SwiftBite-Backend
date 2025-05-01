const express = require('express');
const { deleteAllNotifications, markNotificationAsRead, deleteNotification, sendUsersAllNotifications } = require('../services/NotificationService');
const router = express.Router();

router.put('/mark-as-read/:id',markNotificationAsRead);
router.delete('/delete-notification/:id',deleteNotification);
router.delete('/delete-all-notifications/:userId',deleteAllNotifications);
router.get('/user-all-notifications/:userId',sendUsersAllNotifications);

module.exports = router;