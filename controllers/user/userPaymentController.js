require("dotenv").config();
const axios = require("axios");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const { Cashfree } = require("cashfree-pg");
const { sendNotification } = require("../../services/NotificationService");

// Configure Cashfree
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

// Create a new order and initiate payment
exports.createOrder = async (req, res) => {
    try {
      const { userId } = req.params;
      const { canteenId, totalAmount, cartItems, paymentMethod ,collegeId } = req.body;
     
      // Find user
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Generate session ID
      const sessionId ="123456";
  
      // Map cart items
      const items = cartItems.map((item) => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.itemId.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        offers : item.itemId.offers,
      }));
  
      // Create a new order with sessionId
      const newOrder = new Order({
        userId,
        collegeId,
        canteenId,
        items,
        totalAmount,
        paymentMethod,
        sessionId, // Store session ID in order
        orderStatus: "Pending",
        paymentStatus: "Pending",
      });
  
      await newOrder.save();
  
      // Payment request with session ID
      const paymentRequest = {
        order_amount: totalAmount,
        order_currency: "INR",
        order_id: newOrder._id,
        customer_details: {
          customer_id: userId,
          customer_phone: user.phone || "0000000000",
          customer_name: user.username,
          customer_email: user.email,
        },
        order_meta: {
          return_url: `https://swiftbiteapp.netlify.app/payment-status?order_id=${newOrder._id}&session_id=${sessionId}`,
          notify_url: "https://swiftbite-backend-production.up.railway.app/api/user/payment/webhook",
          payment_methods: "cc,dc,upi",
        },
      };
  
      // Initiate payment with Cashfree
      const response = await Cashfree.PGCreateOrder("2023-08-01", paymentRequest);
     
      newOrder.sessionId=response.data.payment_session_id;
      await newOrder.save();
      
      // Send session ID and payment details to frontend
      res.status(200).json({
        message: "Order created successfully",
        sessionId : response.data.payment_session_id,
        orderData: response.data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error creating order",
        error: error.response ? error.response.data : error.message,
      });
    }
  };
  


// Handle Cashfree webhook for payment updates
exports.paymentWebhook = async (req, res) => {
  try {
    const { order_id } = req.body.data.order;
    const { payment_group, cf_payment_id, payment_status, payment_amount, payment_time } = req.body.data.payment;
    const existingPayment = await Payment.findOne({ transactionId : cf_payment_id });
    if (existingPayment) return res.status(200).send("Payment already processed");

    const order = await Order.findById(order_id).populate("userId","name _id");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const newPayment = new Payment({
      orderId: order_id,
      userId: order.userId._id,
      canteenId: order.canteenId,
      paymentMethod: payment_group,
      transactionId: cf_payment_id,
      paymentStatus: payment_status,
      amountPaid: payment_amount,
      paymentTime: payment_time,
      paymentProvider: "Cashfree",
      webhookRequestData: req.body.data,
    });
    await newPayment.save();

    order.paymentStatus = payment_status === "SUCCESS" ? "Paid" : "Failed";
    order.paymentId = newPayment._id;
    order.paymentMethod = payment_group;
    await order.save();

    await sendNotification({
      userId: order.userId,
      receiverRole: 'student',
      title: 'Order Placed Successfully',
      message: `Your order #${order_id} has been placed. We'll notify you when it's ready.`,
      type: 'order',
      relatedRef: order_id,
      refModel: 'Order',
    });

    const canteenUser = await User.findOne(
      { role: "canteen", canteen: order.canteenId },
      { _id: 1 } // Only select the _id field
    );
    
    await sendNotification({
      userId: canteenUser?._id, // canteen staff userId
      canteenId: order.canteenId,  // optional, if you're grouping by canteen
      receiverRole: 'canteen',
      title: 'New Order Received',
      message: `Order #${order_id} placed by ${order?.userId?.name}. Please prepare it.`,
      type: 'order',
      relatedRef: order_id,
      refModel: 'Order',
    });



    res.status(200).send("OK");
  } catch (error) {
    res.status(500).json({ message: "Error processing payment" });
  }
}; 


// Check payment status for an order
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: "Missing order_id parameter" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ paymentStatus: order.paymentStatus });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment status" });
  }
};


// Verify payment using Cashfree API
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order in your database
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // If payment is already marked as Paid, no need to verify again
    if (order.paymentStatus === "Paid") {
      return res.status(200).json({ message: "Payment already processed" });
    }

    // Request Cashfree API for payment status
    const cashfreeResponse = await axios.get(
      `https://api.cashfree.com/api/v1/order/info/status?orderId=${orderId}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentData = cashfreeResponse.data;

    // If payment was successful, update the order
    if (paymentData.txStatus === "SUCCESS") {
      order.paymentStatus = "Paid";
      await order.save();
      return res.status(200).json({ message: "Payment verified and updated" });
    } else {
      return res.status(400).json({ message: "Payment not successful" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying payment" });
  }
};