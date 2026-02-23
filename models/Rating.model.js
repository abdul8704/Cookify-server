const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true });

// One rating per user-recipe pair (upsert to allow re-rating)
ratingSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
