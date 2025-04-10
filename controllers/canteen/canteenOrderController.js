const Order = require('../../models/Order');

exports.getOrders = async (req,res)=>{
    try {
        const { canteenId } = req.params;
        // Validate canteenId
        if (!canteenId) {
          return res.status(400).json({ success: false, message: "Canteen ID is required" });
        }
    
        // Fetch orders from the database
        const orders = await Order.find({ canteenId })
          .populate("userId", "name email") // Fetch only name & email from User model
          .populate("collegeId", "name location") // Fetch college details
          .populate("canteenId", "name location") 
          .populate("items.productId", "name price image") // Fetch product details
          .sort({ createdAt: -1 }); // Show latest orders first
        // Transform data into frontend-ready response
        const formattedOrders = orders.map((order) => ({
            orderId: order._id,
            user: order.userId
              ? {
                  userId: order.userId._id || null,
                  name: order.userId.name || "Unknown",
                  email: order.userId.email || "No Email",
                }
              : null, // Handle missing userId
          
            college: order.collegeId
              ? {
                  collegeId: order.collegeId._id || null,
                  name: order.collegeId.name || "Unknown",
                  location: order.collegeId.location || "Not Provided",
                }
              : null, // Handle missing collegeId
          
            canteen: order.canteenId
              ? {
                  canteenId: order.canteenId._id || null,
                  name: order.canteenId.name || "Unknown",
                  location: order.canteenId.location || "Not Provided",
                }
              : null, // Handle missing canteenId
          
            items: order.items.map((item) => ({
              productId: item.productId?._id || null, // Check if productId exists
              name: item.productId?.name || item.name || "Unnamed Item",
              price: item.productId?.price || item.price || 0,
              image: item.productId?.image || item.image || "No Image",
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || 0,
            })),
          
            totalAmount: order.totalAmount || 0,
            payment: {
              method: order.paymentMethod || "Not Specified",
              status: order.paymentStatus || "Pending",
              paymentId : order.paymentId,
            },
            orderStatus: order.orderStatus || "Pending",
            pickupTime: order.pickupTime || null,
            deliveredAt: order.deliveredAt || null,
            createdAt: order.createdAt || new Date(),
            updatedAt: order.updatedAt || new Date(),
          }));
          
    
        res.status(200).json({ success: true, orders: formattedOrders });
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server Error" });
      }
}


exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Validate required fields
        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Order ID and Status are required" });
        }

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update the order status
        order.orderStatus = status;
        await order.save({ validateModifiedOnly: true });

        res.status(200).json({ success: true, message: "Order status updated successfully", order });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
