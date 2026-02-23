const NutritionGoals = require('../models/NutritionGoals.model');
const DailyIntake = require('../models/DailyIntake.model');
const Recipe = require('../models/Recipe.model');
const nutritionService = require('../service/nutrition.service');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
const MICROS = [
  'iron',
  'calcium',
  'magnesium',
  'potassium',
  'sodium',
  'zinc',
  'vitaminA',
  'vitaminC',
  'vitaminD',
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function buildEmptyTotals() {
  return {
    calories: 0,
    macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
    micronutrients: {
      iron: 0,
      calcium: 0,
      magnesium: 0,
      potassium: 0,
      sodium: 0,
      zinc: 0,
      vitaminA: 0,
      vitaminC: 0,
      vitaminD: 0,
    },
  };
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Resolve gramsConsumed from request body.
 *   - If `gramsConsumed` is provided directly, use it.
 *   - If `servings` is provided, resolve via recipe.servingSizeGrams.
 *   - Fallback: 1 serving = servingSizeGrams or 100 g.
 */
function resolveGrams(body, recipe) {
  if (body.gramsConsumed != null && toNumber(body.gramsConsumed) > 0) {
    return toNumber(body.gramsConsumed, 100);
  }
  const servings = toNumber(body.servings || body.quantity, 1);
  const perServing = toNumber(recipe?.servingSizeGrams) || 100; // fallback if null/0
  return Math.max(1, Math.round(servings * perServing));
}

function resolveServings(gramsConsumed, recipe) {
  const perServing = toNumber(recipe?.servingSizeGrams) || 100;
  return perServing > 0 ? +(gramsConsumed / perServing).toFixed(2) : 1;
}

/**
 * Calculate nutrition for `gramsConsumed` of a recipe whose
 * nutritionPer100g stores values per 100 g.
 */
function calculateEntryNutrition(recipe, gramsConsumed) {
  const n = recipe.nutritionPer100g || recipe.nutrition || {};
  const factor = toNumber(gramsConsumed, 100) / 100;

  const macros = n.macros || {};
  const micros = n.micros || {};

  const entryNutrition = {
    calories: toNumber(n.calories) * factor,
    macros: {
      protein: toNumber(macros.protein) * factor,
      carbs: toNumber(macros.carbs) * factor,
      fat: toNumber(macros.fat) * factor,
      fiber: toNumber(macros.fiber) * factor,
    },
    micronutrients: {},
  };

  // Also support flat keys for backward compatibility
  if (!macros.protein && n.protein) entryNutrition.macros.protein = toNumber(n.protein) * factor;
  if (!macros.carbs && n.carbs) entryNutrition.macros.carbs = toNumber(n.carbs) * factor;
  if (!macros.fat && n.fat) entryNutrition.macros.fat = toNumber(n.fat) * factor;
  if (!macros.fiber && n.fiber) entryNutrition.macros.fiber = toNumber(n.fiber) * factor;

  for (const key of MICROS) {
    entryNutrition.micronutrients[key] = toNumber(micros[key]) * factor;
  }

  return entryNutrition;
}

function mergeTotals(totals, entryNutrition) {
  totals.calories += entryNutrition.calories;
  totals.macros.protein += entryNutrition.macros.protein;
  totals.macros.carbs += entryNutrition.macros.carbs;
  totals.macros.fat += entryNutrition.macros.fat;
  totals.macros.fiber += entryNutrition.macros.fiber;

  for (const key of MICROS) {
    totals.micronutrients[key] += entryNutrition.micronutrients[key] || 0;
  }
}

async function ensureIntake(userId, date) {
  const intakeDate = date || todayString();
  let intake = await DailyIntake.findOne({ userId, date: intakeDate });
  if (!intake) {
    intake = await DailyIntake.create({ userId, date: intakeDate });
  }
  return intake;
}

async function populateIntake(intakeId) {
  return DailyIntake.findById(intakeId)
    .populate('meals.breakfast.recipeId', 'name description nutritionPer100g servingSizeGrams')
    .populate('meals.lunch.recipeId', 'name description nutritionPer100g servingSizeGrams')
    .populate('meals.dinner.recipeId', 'name description nutritionPer100g servingSizeGrams')
    .populate('meals.snack1.recipeId', 'name description nutritionPer100g servingSizeGrams')
    .populate('meals.snack2.recipeId', 'name description nutritionPer100g servingSizeGrams');
}

async function recalculateIntake(intake) {
  const totals = buildEmptyTotals();
  const recipeIds = [];

  for (const mealType of MEAL_TYPES) {
    const entries = intake.meals?.[mealType] || [];
    for (const entry of entries) {
      recipeIds.push(String(entry.recipeId));
    }
  }

  const uniqueIds = [...new Set(recipeIds)];
  const recipes = await Recipe.find({ _id: { $in: uniqueIds } }).select(
    'nutritionPer100g nutrition servingSizeGrams'
  );
  const recipeById = new Map(recipes.map((r) => [String(r._id), r]));

  for (const mealType of MEAL_TYPES) {
    const entries = intake.meals?.[mealType] || [];
    for (const entry of entries) {
      const recipe = recipeById.get(String(entry.recipeId));
      if (!recipe) continue;

      // Backward compat: migrate old entries that used quantity instead of gramsConsumed
      if (!entry.gramsConsumed || entry.gramsConsumed <= 0) {
        const oldQty = entry.quantity || entry.servings || 1;
        const perServing = toNumber(recipe.servingSizeGrams) || 100;
        entry.gramsConsumed = Math.max(1, Math.round(oldQty * perServing));
        entry.servings = oldQty;
      }

      const entryNutrition = calculateEntryNutrition(recipe, entry.gramsConsumed);
      entry.nutritionSnapshot = entryNutrition;
      mergeTotals(totals, entryNutrition);
    }
  }

  intake.totals = totals;

  // Mongoose doesn't detect deep mutations inside nested subdocument arrays,
  // so we must mark every modified path explicitly.
  for (const mealType of MEAL_TYPES) {
    intake.markModified(`meals.${mealType}`);
  }
  intake.markModified('totals');
}

// GET /api/nutrition/goals
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await nutritionService.syncAutoGoalsForUser(userId);
    return res.status(200).json({ success: true, data: goals });
  } catch (err) {
    console.error('Get goals error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/nutrition/goals
exports.updateGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};

    let base = await NutritionGoals.findOne({ userId });
    if (!base) {
      base = await nutritionService.syncAutoGoalsForUser(userId);
    }

    const updates = {};
    if (body.dailyCalories !== undefined) updates.dailyCalories = toNumber(body.dailyCalories, 0);
    if (body.goalType !== undefined) updates.goalType = body.goalType;

    const macrosPatch = { ...(base.macros?.toObject?.() || base.macros || {}) };
    if (body.macros && typeof body.macros === 'object') {
      for (const key of ['protein', 'carbs', 'fat', 'fiber']) {
        if (body.macros[key] !== undefined) macrosPatch[key] = toNumber(body.macros[key], macrosPatch[key] || 0);
      }
    }
    if (body.protein !== undefined) macrosPatch.protein = toNumber(body.protein, macrosPatch.protein || 0);
    if (body.carbs !== undefined) macrosPatch.carbs = toNumber(body.carbs, macrosPatch.carbs || 0);
    if (body.fat !== undefined) macrosPatch.fat = toNumber(body.fat, macrosPatch.fat || 0);
    if (body.fiber !== undefined) macrosPatch.fiber = toNumber(body.fiber, macrosPatch.fiber || 0);
    updates.macros = macrosPatch;

    const microsPatch = { ...(base.micronutrients?.toObject?.() || base.micronutrients || {}) };
    if (body.micronutrients && typeof body.micronutrients === 'object') {
      for (const key of MICROS) {
        if (body.micronutrients[key] !== undefined) {
          microsPatch[key] = toNumber(body.micronutrients[key], microsPatch[key] || 0);
        }
      }
    }
    updates.micronutrients = microsPatch;
    updates.source = 'manual';
    updates.lastComputedAt = new Date();

    const goals = await NutritionGoals.findOneAndUpdate(
      { userId },
      { $set: updates },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, data: goals });
  } catch (err) {
    console.error('Update goals error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/nutrition/intake?date=YYYY-MM-DD
exports.getIntake = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || todayString();
    const intake = await ensureIntake(userId, date);
    await recalculateIntake(intake);
    await intake.save();
    const populated = await populateIntake(intake._id);
    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error('Get intake error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/nutrition/intake/meal
// Body: { date?, mealType, recipeId, gramsConsumed? | servings? | quantity? }
exports.addMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const { date, mealType, recipeId } = body;

    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ success: false, message: `mealType must be one of: ${MEAL_TYPES.join(', ')}` });
    }
    if (!recipeId) {
      return res.status(400).json({ success: false, message: 'recipeId is required' });
    }

    const recipe = await Recipe.findById(recipeId).select('servingSizeGrams');
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    const intake = await ensureIntake(userId, date || todayString());
    const grams = resolveGrams(body, recipe);
    const servings = resolveServings(grams, recipe);

    intake.meals[mealType].push({
      recipeId,
      gramsConsumed: grams,
      servings,
      consumedAt: new Date(),
    });

    await recalculateIntake(intake);
    await intake.save();
    const populated = await populateIntake(intake._id);
    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error('Add meal error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/nutrition/intake/meal
// Body: { date?, mealType, mealEntryId, gramsConsumed? | servings? | quantity? }
exports.updateMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const { date, mealType, mealEntryId } = body;

    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ success: false, message: `mealType must be one of: ${MEAL_TYPES.join(', ')}` });
    }
    if (!mealEntryId) {
      return res.status(400).json({ success: false, message: 'mealEntryId is required' });
    }

    const intake = await DailyIntake.findOne({ userId, date: date || todayString() });
    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }

    const entries = intake.meals[mealType] || [];
    const entry = entries.find((e) => String(e._id) === String(mealEntryId));
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Meal entry not found' });
    }

    const recipe = await Recipe.findById(entry.recipeId).select('servingSizeGrams');
    const grams = resolveGrams(body, recipe);
    entry.gramsConsumed = grams;
    entry.servings = resolveServings(grams, recipe);

    await recalculateIntake(intake);
    await intake.save();
    const populated = await populateIntake(intake._id);
    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error('Update meal error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/nutrition/intake/meal
exports.removeMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, mealType, mealEntryId } = req.body || {};
    const intake = await DailyIntake.findOne({ userId, date: date || todayString() });

    if (!intake) {
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }
    if (!mealType || !MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ success: false, message: `mealType must be one of: ${MEAL_TYPES.join(', ')}` });
    }

    const entries = intake.meals[mealType] || [];
    if (mealEntryId) {
      intake.meals[mealType] = entries.filter((entry) => String(entry._id) !== String(mealEntryId));
    } else {
      intake.meals[mealType] = [];
    }

    await recalculateIntake(intake);
    await intake.save();
    const populated = await populateIntake(intake._id);
    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error('Remove meal error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
