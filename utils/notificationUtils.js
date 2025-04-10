const axios = require("axios");
require("dotenv").config();

/**
 * Send a push notification using OneSignal
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string[]} userIds - Array of user IDs to receive the notification
 * @returns {Promise<object>} - API response
 */
const sendNotification = async (title, message, userIds) => {
  if (!title || !message || !userIds || userIds.length === 0) {
    throw new Error("Missing required parameters");
  }

  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: process.env.ONESIGNAL_APP_ID, // OneSignal App ID
        include_external_user_ids: userIds, // Array of user IDs
        headings: { en: title },
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`, // OneSignal API Key
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("OneSignal Error:", error.response ? error.response.data : error.message);
    throw new Error("Failed to send notification");
  }
};

module.exports = { sendNotification };
