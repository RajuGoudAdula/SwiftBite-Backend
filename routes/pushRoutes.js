const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// VAPID key setup
webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save subscription
router.post('/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  await PushSubscription.findOneAndUpdate(
    { userId },
    { subscription },
    { upsert: true, new: true }
  );

  res.status(201).json({ message: 'Subscription saved' });
});

// Unsubscribe route
router.post('/unsubscribe', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    await PushSubscription.deleteOne({ userId });
    res.status(200).json({ message: 'Subscription removed' });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});


// Send notification
router.post('/notify', async (req, res) => {
  const {
    userId,
    title,
    message,
    url = '/',
    icon = '/favicon/icon-192x192.png',
    badge = '/favicon/badge-72x72.png',
    vibrate = [200, 100, 200],
    actions = [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  } = req.body;

  // Validation
  if (!userId || !title || !message) {
    return res.status(400).json({ error: 'userId, title, and message are required.' });
  }

  try {
    const subscriptions = await PushSubscription.find({ userId });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found for this user.' });
    }

    const payload = JSON.stringify({
      title,
      options: {
        body: message,
        icon,
        badge,
        vibrate,
        data: { url },
        actions,
        requireInteraction: true
      }
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err) {
        console.error(`Web Push failed for subscription: ${sub._id}`, err.message);
        // Optionally remove invalid subscriptions
      }
    }

    res.status(200).json({ message: 'Notification sent successfully.' });
  } catch (err) {
    console.error('Server error while sending push notification:', err.message);
    res.status(500).json({ error: 'Internal server error while sending notification.' });
  }
});

module.exports = router;
