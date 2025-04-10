const axios = require("axios");
require("dotenv").config({ path: "../env" });


const initiateCashfreeRefund = async (transactionId, amount) => {
  try {
    // ✅ Get Cashfree credentials from environment variables
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Cashfree credentials missing in environment variables");
    }

    // ✅ Define API URL based on environment
    const BASE_URL = process.env.CASHFREE_ENV === "sandbox"
      ? "https://sandbox.cashfree.com"
      : "https://api.cashfree.com";

    // ✅ Get authentication token (Corrected Headers)
    const authResponse = await axios.post(
      `${BASE_URL}/pg/orders`,
      {},
      {
        headers: {
          "X-Client-Id": clientId,
          "X-Client-Secret": clientSecret,
          "Content-Type": "application/json",
        },
      }
    );

    const authToken = authResponse.data.cftoken;
    if (!authToken) {
      throw new Error("Failed to get Cashfree token");
    }

    // ✅ Call Cashfree Refund API
    const refundResponse = await axios.post(
      `${BASE_URL}/pg/refunds`,
      {
        referenceId: transactionId, // Original payment transaction ID
        refundAmount: amount,
        refundNote: "Customer Order Cancellation",
      },
      {
        headers: {
          "X-Client-Id": clientId,
          "X-Client-Secret": clientSecret,
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Check if refund was successful
    if (refundResponse.data.status === "SUCCESS") {
      return { success: true, refundId: refundResponse.data.refundId };
    } else {
      return { success: false, message: refundResponse.data.message };
    }
  } catch (error) {
    console.error("Refund Error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || "Refund request failed" };
  }
};

module.exports = initiateCashfreeRefund;
