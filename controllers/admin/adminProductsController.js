const Product = require("../../models/Product"); // Import Product model
const CanteenMenuItem = require("../../models/CanteenMenuItem");
const Cart = require("../../models/Cart");

// ✅ Fetch all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Fetch a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add a new product
exports.addProduct = async (req, res) => {
  try {
    const {
        name,
        description,
        image,
        category,
        ingredients,
        allergens,
        calories,
        protein,
        fat,
        carbohydrates,
        fiber,
        tags,
        netWeight,
        unit
      } = req.body;
      
      const processedData = {
        name,
        description,
        image,
        category,
        ingredients: ingredients.map(item => item.replace(/['"]+/g, '')), // Remove extra quotes
        allergens,
        nutritionalInfo: {
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          fat: Number(fat) || 0,
          carbohydrates: Number(carbohydrates) || 0,
          fiber: Number(fiber) || 0
        },
        tags,
        netWeight,
        unit
      };
      
    const newProduct = await Product.create(processedData);

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update an existing product
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ✅ Delete a product and remove it from all canteen menus and user carts
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Step 1: Delete product from Product collection
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Step 2: Delete all menu items with that productId
    await CanteenMenuItem.deleteMany({ productId });

    // Step 3: Remove the product from all user carts
    const carts = await Cart.find({ "items.productId": productId });

    for (const cart of carts) {
      // Filter out the deleted product from the cart items
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);

      // Recalculate totalAmount
      cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

      await cart.save();
    }

    res.status(200).json({ message: "Product deleted from system, canteen menus, and all user carts." });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

