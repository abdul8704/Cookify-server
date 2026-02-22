const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['meat','fruit', 'vegetable', 'spice', 'breakfast' ,'snack', 'lunch', 'dinner', 'oil', 'other'],
    default: 'other'
  },
  imageURL: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

inventoryItemSchema.index({ userId: 1, ingredientId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
