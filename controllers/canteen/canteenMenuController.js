const MenuItem = require("../../models/CanteenMenuItem"); // Import MenuItem model
const Cart = require("../../models/Cart");

exports.getMenuItems = async (req, res) => {
    try {
      const menuItems = await MenuItem.find().sort({ createdAt: -1 }).populate('productId');; // Sort by latest
      res.status(200).json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items", error });
    }
  };

  exports.getMenuItemById = async (req, res) => {
    try {
      const menuItem = await MenuItem.findById(req.params.id);
      if (!menuItem) return res.status(404).json({ message: "Menu item not found" });
  
      res.status(200).json(menuItem);
    } catch (error) {
      res.status(500).json({ message: "Error fetching menu item", error });
    }
  };

  exports.addMenuItem = async (req, res) => {
    try {
      const {canteenId} = req.params;
      const itemData ={
        canteenId, 
        productId : req.body.productId, 
        name : req.body.name,
        price : 0, 
        stock : 0, 
        preparationTime : 0, 
        deliveryTime : 0, 
        isAvailable : false
      };
  
      const newMenuItem = new MenuItem(itemData);
      await newMenuItem.save();
      
      const populatedMenuItem = await newMenuItem.populate('productId');

      res.status(201).json({
        message: "Menu item added successfully",
        newMenuItem: populatedMenuItem
      });
    } catch (error) {
      res.status(500).json({ message: "Error adding menu item", error });
    }
  };



exports.updateMenuItem = async (req, res) => {
  try {
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMenuItem) return res.status(404).json({ message: "Menu item not found" });

    // ✅ Update matching products in user carts
    const carts = await Cart.find({ "items.productId": updatedMenuItem.productId });

    for (const cart of carts) {
      let updated = false;

      cart.items = cart.items.map(item => {
        if (item.productId.toString() === updatedMenuItem.productId.toString()) {
          updated = true;
          const newTotalPrice = updatedMenuItem.price * item.quantity;
          return {
            ...item.toObject(),
            name: updatedMenuItem.name,
            price: updatedMenuItem.price,
            totalPrice: newTotalPrice,
          };
        }
        return item;
      });

      if (updated) {
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        await cart.save();
      }
    }
    const populatedMenuItem = await updatedMenuItem.populate('productId');

    res.status(200).json({ message: "Menu item updated successfully", updatedMenuItem : populatedMenuItem });
  } catch (error) {
    res.status(500).json({ message: "Error updating menu item", error: error.message });
  }
};


exports.deleteMenuItem = async (req, res) => {
  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!deletedMenuItem) return res.status(404).json({ message: "Menu item not found" });

    // ✅ Remove this product from all user carts
    const carts = await Cart.find({ "items.productId": deletedMenuItem.productId });

    for (const cart of carts) {
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => item.productId.toString() !== deletedMenuItem.productId.toString());

      if (cart.items.length !== originalLength) {
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        await cart.save();
      }
    }

    res.status(200).json({ message: "Menu item deleted successfully and removed from all user carts." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu item", error: error.message });
  }
};

  