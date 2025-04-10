const CanteenMenuItem = require('../../models/CanteenMenuItem.js');
const Order =   require('../../models/Order.js');
const Product = require('../../models/Product.js');
const User = require('../../models/User.js');
const NotificationService = require('../../services/NotificationService.js');

// ✅ Create Menu Item
exports.createMenuItem = async (req, res) => {
  try {
    const { productId, price, stock, preparationTime, deliveryTime, offers, availability } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const newItem = await CanteenMenuItem.create({
      canteenId: req.canteen._id,
      productId,
      name: product.name,
      images: product.images,
      price,
      stock,
      preparationTime,
      deliveryTime,
      offers,
      availability
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Get Menu Items
exports.getMenuItems = async (req, res) => {
  try {
    const items = await CanteenMenuItem.find({ canteenId: req.canteen._id });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Update Menu Item
exports.updateMenuItem = async (req, res) => {
  try {
    const updatedItem = await CanteenMenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Delete Menu Item
exports.deleteMenuItem = async (req, res) => {
  try {
    await CanteenMenuItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Menu Item Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Get Orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ canteenId: req.canteen._id }).populate('items.productId');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true });

    if (orderStatus === 'Ready For Pickup') {
      const user = await User.findById(order.userId);
      NotificationService.send(user._id, 'Your order is ready for pickup');
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Scan QR and Deliver Food
exports.scanQRDeliverFood = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = 'Completed';
    order.deliveredAt = new Date();
    await order.save();

    res.status(200).json({ message: 'Food Delivered Successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ Push Notification
exports.pushNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    NotificationService.broadcast(req.canteen.collegeId, title, message);
    res.status(200).json({ message: 'Notification Sent' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
