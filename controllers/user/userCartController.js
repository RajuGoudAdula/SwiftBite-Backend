const Cart = require("../../models/Cart");
const CanteenMenuItem = require("../../models/CanteenMenuItem");
const Product = require("../../models/Product");
const Review = require("../../models/Review");
const User= require("../../models/User");

// Get User's Cart
exports.getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Get user with canteen reference
    const user = await User.findById(userId).select('canteen');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userCanteenId = user.canteen?.toString();
    if (!userCanteenId) {
      return res.status(400).json({ message: "User has no canteen assigned" });
    }

    // 2. Find existing cart
    let cart = await Cart.findOne({ userId })
                            .populate({
                              path: "items.productId",
                              select: "image name unit netWeight"
                            })
                            .populate({
                              path: "items.itemId",
                              select: "price offers"
                            });

    // 3. Check canteen match
    if (cart) {
      if (cart.canteenId.toString() === userCanteenId) {
        
        return res.status(200).json({
          cart: cart,
          message: "Existing cart found"
        });
      } else {
        // Canteen mismatch - delete old cart
        await Cart.deleteOne({ _id: cart._id });
      }
    }

    // 4. Create new empty cart
    const newCart = await Cart.create({
      userId,
      canteenId: userCanteenId,
      items: [],
      totalAmount: 0
    });

    res.status(200).json({
      cart: newCart.toObject(),
      message: "New cart created"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to process cart",
      error: error.message
    });
  }
};

// Add Item to Cart
exports.addToCart = async (req, res) => {
    try {
      const { itemId, quantity } = req.body;
      const { userId } = req.params;
      const canteenMenuItem = await CanteenMenuItem.findById(itemId);
                      
      if (!canteenMenuItem) return res.status(404).json({ message: "Item not found" });
  
      if (canteenMenuItem.stock < quantity) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
  
      if (!canteenMenuItem.isAvailable) {
        return res.status(400).json({ message: "Item is not available" });
      }
  
      let cart = await Cart.findOne({ userId });
  
      if (!cart) {
        cart = new Cart({
          userId,
          canteenId: canteenMenuItem.canteenId,
          items: [],
          totalAmount: 0,
        });
      } else if (cart.canteenId.toString() !== canteenMenuItem.canteenId.toString()) {
        return res.status(400).json({ message: "Cannot add items from different canteens" });
      }
  
      const existingItem = cart.items.find(
        item => item.productId.toString() === canteenMenuItem.productId.toString()
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
        if(canteenMenuItem.offers.length>0){
          existingItem.totalPrice = (canteenMenuItem.price - canteenMenuItem.price * canteenMenuItem.offers[0].discount/100)*existingItem.quantity;
        }else{
          existingItem.totalPrice = existingItem.quantity * canteenMenuItem.price;
        }
      } else {
        let totalPrice ;
        if(canteenMenuItem.offers.length>0){
          totalPrice = (canteenMenuItem.price - (canteenMenuItem.price * canteenMenuItem.offers[0].discount/100))*quantity;
        }else{
          totalPrice = quantity * canteenMenuItem.price;
        }
        cart.items.push({
          productId: canteenMenuItem.productId,
          itemId: canteenMenuItem._id,
          quantity,
          totalPrice: totalPrice,
        });
      }
  
      cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      await cart.save();
      const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: "items.productId",
        select: "image name unit netWeight"
      })
      .populate({
        path: "items.itemId",
        select: "price offers"
      });

      res.status(200).json({ message: "Item added to cart", cart : populatedCart });
    } catch (error) {
      res.status(500).json({ message: "Error adding to cart", error });
    }
  };
  

// Update Cart Item Quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, delta } = req.body;
    const {userId} = req.params;
   
    const cart = await Cart.findOne({ userId })
                                .populate({
                                  path: "items.itemId",
                                  select: "price offers"
                                });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item.productId.toString() === itemId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = delta;
    if(item.itemId.offers.length > 0){
      item.totalPrice = ((item.itemId.price)-(item.itemId.price*item.itemId.offers[0].discount/100))* delta;
    }else{
      item.totalPrice = item.itemId.price*delta;
    }

    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    await cart.save();

    res.status(200).json({ message: "Cart item updated", cart });
  } catch (error) {
    res.status(500).json({ message: "Error updating cart item", error });
  }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const {userId,itemId} = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.productId.toString() !== itemId);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Error removing item", error });
  }
};

// Clear Cart After Order
exports.clearCart = async (req, res) => {
  try {
    const {userId} = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    cart.totalAmount = 0;
    cart.status = "ordered";

    await cart.save();
    res.status(200).json({ message: "Cart cleared after order" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing cart", error });
  }
};


exports.getItemDetails = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find the item details from CanteenMenuItem
    const menuItem = await CanteenMenuItem.findById(itemId).populate("productId");

    if (!menuItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Fetch product details
    const productDetails = await Product.findById(menuItem.productId);

    // Fetch reviews for the product
    const reviews = await Review.findOne({ productId: menuItem.productId }).populate("reviews.userId", "name");

    // Prepare response data
    const responseData = {
      item: {
        _id: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        stock: menuItem.stock,
        isAvailable: menuItem.isAvailable,
        preparationTime: menuItem.preparationTime,
        deliveryTime: menuItem.deliveryTime,
        offers: menuItem.offers,
        availability: menuItem.availability,
        totalOrders: menuItem.totalOrders,
        totalRevenue: menuItem.totalRevenue,
        lastOrderDate: menuItem.lastOrderDate,
        createdAt: menuItem.createdAt,
        updatedAt: menuItem.updatedAt,
      },
      product: {
        _id: productDetails._id,
        name: productDetails.name,
        description: productDetails.description,
        image: productDetails.image,
        category: productDetails.category,
        ingredients: productDetails.ingredients,
        allergens: productDetails.allergens,
        nutritionalInfo: productDetails.nutritionalInfo,
        tags: productDetails.tags,
        unit:productDetails.unit,
        netWeight : productDetails.netWeight,
        createdAt: productDetails.createdAt,
        updatedAt: productDetails.updatedAt,
      },
      reviews: reviews
        ? reviews.reviews.map((review) => ({
            _id: review._id,
            user: {
              _id: review.userId._id,
              name: review.isAnonymous ? "Anonymous" : review.userId.name,
            },
            rating: review.rating,
            review: review.review,
            images: review.images,
            likes: review.likes.length,
            dislikes: review.dislikes.length,
            canteenResponse: review.canteenResponse,
            createdAt: review.createdAt,
          }))
        : [],
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Error getting item details", error });
  }
};

console