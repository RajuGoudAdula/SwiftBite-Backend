const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String, required: true },
  category: {
    type: String,
    enum: ["Main Course", "Side Dish", "Dessert", "Beverage", "Snacks"],
    required: true
  },
  unit: {
    type: String,
    enum: ["plate", "bottle", "pack", "box", "glass", "cup", "bowl"],
    required: true
  },
  netWeight: { type: String, required: true },
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    fat: Number,
    carbohydrates: Number,
    fiber: Number
  },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 🔁 Automatically update CanteenMenuItem entries when a Product is updated
productSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    const CanteenMenuItem = mongoose.model("CanteenMenuItem");
    await CanteenMenuItem.updateMany(
      { productId: doc._id },
      {
        $set: {
          name: doc.name,
          description: doc.description,
          images: doc.image,
          category: doc.category,
          unit: doc.unit,
          netWeight: doc.netWeight,
          ingredients: doc.ingredients,
          allergens: doc.allergens,
          nutritionalInfo: doc.nutritionalInfo,
          tags: doc.tags,
          updatedAt: new Date()
        }
      }
    );
  }
});

module.exports = mongoose.model("Product", productSchema);
