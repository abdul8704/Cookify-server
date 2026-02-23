const mongoose = require('mongoose');

const macrosSchema = new mongoose.Schema(
  {
    protein: { type: Number, default: 100 }, // grams
    carbs: { type: Number, default: 250 }, // grams
    fat: { type: Number, default: 70 }, // grams
    fiber: { type: Number, default: 30 }, // grams
  },
  { _id: false }
);

const micronutrientsSchema = new mongoose.Schema(
  {
    iron: { type: Number, default: 8 }, // mg
    calcium: { type: Number, default: 1000 }, // mg
    magnesium: { type: Number, default: 400 }, // mg
    potassium: { type: Number, default: 3500 }, // mg
    sodium: { type: Number, default: 2300 }, // mg
    zinc: { type: Number, default: 11 }, // mg
    vitaminA: { type: Number, default: 900 }, // ug
    vitaminC: { type: Number, default: 90 }, // mg
    vitaminD: { type: Number, default: 15 }, // ug
  },
  { _id: false }
);

const nutritionGoalsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    goalType: {
      type: String,
      enum: ['weightloss', 'weightgain', 'maintain'],
      default: 'maintain',
    },
    dailyCalories: { type: Number, default: 2000 },
    macros: {
      type: macrosSchema,
      default: () => ({}),
    },
    micronutrients: {
      type: micronutrientsSchema,
      default: () => ({}),
    },
    source: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto',
    },
    computedFromProfile: {
      age: { type: Number, default: null },
      height: { type: Number, default: null },
      weight: { type: Number, default: null },
      activityLevel: { type: String, default: '' },
      gender: { type: String, default: '' },
      goals: { type: String, default: 'maintain' },
    },
    lastComputedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NutritionGoals', nutritionGoalsSchema);
