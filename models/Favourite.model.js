const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
    index: true,
  },
}, { timestamps: true });

// One favourite per user-recipe pair
favouriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);
