const mongoose = require('mongoose');

const favouriteItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // or your actual item model
    required: true,
  },
});

const canteenSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen', // or your canteen model
    required: true,
  },
  favouriteItems: [favouriteItemSchema],
});

const favouriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  canteens: [canteenSchema],
});

module.exports= mongoose.model('Favourite', favouriteSchema);
