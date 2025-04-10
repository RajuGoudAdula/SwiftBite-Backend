const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const initiateCashfreeRefund = require("../../utils/initiateCashfreeRefund"); // Import function




// Fetch all orders of a specific user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId , canteenId } = req.params;
    const orders = await Order.find({ userId ,canteenId }).sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Error retrieving orders" });
  }
};

// Fetch a specific order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Error retrieving order" });
  }
};

// Update order status (Admin can update order status)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = orderStatus;
    await order.save();

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ✅ Find order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
   
    // ✅ Only allow cancellation if order is still "Pending"
    if (order.orderStatus !== "Pending") {
      return res.status(400).json({ message: "Order cannot be canceled at this stage" });
    }

    // ✅ If prepaid (not COD), initiate refund
    if (order.paymentMethod !== "Cash On Delivery") {
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        const refundResult = await initiateCashfreeRefund(payment.transactionId, payment.amountPaid);

        if (!refundResult.success) {
          return res.status(500).json({ message: "Refund failed: " + refundResult.message });
        }

        payment.paymentStatus = "Refunded";
        await payment.save();
      }
    }

    // ✅ Update order status to "Cancelled"
    order.orderStatus = "Cancelled";
    await order.save();

    res.status(200).json({ message: "Order canceled successfully", order });
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({ message: "Error canceling order" });
  }
};

const deleteUnpaidOrders = async () => {
  try {
    console.log("Checking for unpaid orders...");
    
    // Find all pending orders
    const pendingOrders = await Order.find({ paymentStatus: "Pending" });

    for (const order of pendingOrders) {
      // Check if a payment exists for this sessionId
      const existingPayment = await Payment.findOne({ orderId: order._id });

      if (!existingPayment) {
        console.log(`Deleting unpaid order: ${order._id}`);
        await Order.findByIdAndDelete(order._id);
      }
    }
  } catch (error) {
    console.error("Error deleting unpaid orders:", error);
  }
};

// Run this function every 5 minutes
setInterval(deleteUnpaidOrders, 5 * 60 * 1000);

