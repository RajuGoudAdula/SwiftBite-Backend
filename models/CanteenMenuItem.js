const mongoose = require("mongoose");

const canteenMenuItemSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Canteen",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number, // In minutes (Example: 15 mins)
    required: true,
  },
  deliveryTime: {
    type: Number, // In minutes (Example: 30 mins)
    required: true,
  },
  offers: [
    {
      offerType: {
        type: String, // Example: "Buy 1 Get 1", "10% Off"
      },
      discount: {
        type: Number, // Example: 50% Off => 50
      },
      validUntil: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    }
  ],
  availability: {
    startTime: {
      type: String, // Example: "10:00 AM"
    },
    endTime: {
      type: String, // Example: "8:00 PM"
    }
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  lastOrderDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });


canteenMenuItemSchema.index({
  name: 'text',
  'offers.offerType': 'text'
});

// Search static method
canteenMenuItemSchema.statics.searchItems = async function(query, canteenId) {
  return this.find({
    $and: [
      { canteenId },
      { 
        $text: { 
          $search: query,
          $caseSensitive: false,
          $diacriticSensitive: false 
        } 
      },
      { isAvailable: true }
    ]
  })
  .populate('productId', 'name images')
  .sort({ score: { $meta: "textScore" } })
  .limit(10)
  .exec();
};

// 2️⃣ Your existing pre-save hook comes after
canteenMenuItemSchema.pre("save", async function(next) {
  const Product = mongoose.model("Product");
  const product = await Product.findById(this.productId);

  if (product) {
    this.name = product.name;
    this.images = product.images;
  }

  next();
});

module.exports = mongoose.model("CanteenMenuItem", canteenMenuItemSchema);

