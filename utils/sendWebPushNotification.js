const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const sendWebPushNotification = async (userId, payload) => {
  try {
    const subs = await PushSubscription.find({ userId });
    const notificationPayload = JSON.stringify(payload);

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub.subscription, notificationPayload);
      } catch (err) {
        console.error("Push failed:", err.message);
      }
    }
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
};

module.exports = sendWebPushNotification;
