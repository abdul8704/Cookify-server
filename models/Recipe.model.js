const mongoose = require("mongoose");

const recipeIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true
  },
  quantity: {
    type: Number,        // grams of this ingredient per 100 g of the recipe
    required: true
  },
  unit: {
    type: String,
    default: "g"
  }
}, { _id: false });

const recipeStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  instruction: {
    type: String,
    required: true,
    trim: true
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  mediaUrl: {
    type: String,
    default: null
  }
}, { _id: false });

const recipeSchema = new mongoose.Schema({

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

  description: {
    type: String,
    default: ""
  },

  ingredients: [recipeIngredientSchema],

  steps: [recipeStepSchema],

  totalDurationMinutes: {
    type: Number,
    default: 0
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },

  servings: {
    type: Number,
    default: 1
  },

  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },

  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  cuisine: {
    type: String,
    lowercase: true,
    trim: true
  },

  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    lowercase: true
  },

  // Nutrition values per 100 g of this recipe (auto-computed from ingredients)
  nutritionPer100g: {
    calories: { type: Number, default: 0 },
    macros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    micros: {
      iron: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      magnesium: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
      zinc: { type: Number, default: 0 },
      vitaminA: { type: Number, default: 0 },
      vitaminC: { type: Number, default: 0 },
      vitaminD: { type: Number, default: 0 },
    },
  },

  // Typical grams in one serving (e.g. 250 g for a bowl of rice)
  servingSizeGrams: {
    type: Number,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

recipeSchema.index({ name: "text", tags: "text" });

module.exports = mongoose.model("Recipe", recipeSchema);
