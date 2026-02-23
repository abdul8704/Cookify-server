const mongoose = require('mongoose');

const macroSchema = new mongoose.Schema(
  {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  { _id: false }
);

const micronutrientsSchema = new mongoose.Schema(
  {
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
  { _id: false }
);

const nutritionSnapshotSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    macros: {
      type: macroSchema,
      default: () => ({}),
    },
    micronutrients: {
      type: micronutrientsSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const mealEntrySchema = new mongoose.Schema({
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
  },
  // How many grams of the recipe the user actually consumed
  gramsConsumed: {
    type: Number,
    required: true,
    default: 100,
    min: 1,
  },
  // Convenience: number of servings (gramsConsumed = servings × servingSizeGrams)
  servings: {
    type: Number,
    default: 1,
    min: 0.1,
  },
  consumedAt: {
    type: Date,
    default: Date.now,
  },
  nutritionSnapshot: {
    type: nutritionSnapshotSchema,
    default: () => ({}),
  },
});

const mealsSchema = new mongoose.Schema(
  {
    breakfast: {
      type: [mealEntrySchema],
      default: () => [],
    },
    lunch: {
      type: [mealEntrySchema],
      default: () => [],
    },
    dinner: {
      type: [mealEntrySchema],
      default: () => [],
    },
    snack1: {
      type: [mealEntrySchema],
      default: () => [],
    },
    snack2: {
      type: [mealEntrySchema],
      default: () => [],
    },
  },
  { _id: false }
);

const totalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    macros: {
      type: macroSchema,
      default: () => ({}),
    },
    micronutrients: {
      type: micronutrientsSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const dailyIntakeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    meals: {
      type: mealsSchema,
      default: () => ({}),
    },
    totals: {
      type: totalsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

dailyIntakeSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyIntake', dailyIntakeSchema);
