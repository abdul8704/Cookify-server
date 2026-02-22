const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  aliases: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  category: {
    type: String,
    default: "other"
  },

  baseUnit: {
    type: String,
    default: "g"
  },

  nutritionPer100g: {
    calories: { type: Number, required: true },

    macros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 }
    },

    micros: {
      iron: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      magnesium: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
      vitaminA: { type: Number, default: 0 },
      vitaminC: { type: Number, default: 0 },
      vitaminD: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
      zinc: { type: Number, default: 0 }
    }
  },

  image: {
    type: String,
    default: null,
    trim: true
  },

  density: {
    type: Number,
    default: null
  }

}, { timestamps: true });

ingredientSchema.index({ name: 1 });
ingredientSchema.index({ aliases: 1 });

module.exports = mongoose.model('Ingredient', ingredientSchema);