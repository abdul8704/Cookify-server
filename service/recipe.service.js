const mongoose = require('mongoose');
const slugify = require('slugify');
const Recipe = require('../models/Recipe.model');
const Ingredient = require('../models/Ingredient.model');

const MICROS = [
  'iron', 'calcium', 'magnesium', 'potassium',
  'sodium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD',
];

/**
 * Compute nutritionPer100g for a recipe.
 *
 * Each recipe ingredient stores the grams of that ingredient used
 * per 100 g of the finished recipe.  This function sums the nutritional
 * contribution of every ingredient to produce a per-100g total.
 *
 * Formula (per nutrient):
 *   value = Σ ( ingredient.nutritionPer100g[nutrient] × ingredientGrams / 100 )
 */
async function computeNutritionPer100g(ingredientsList) {
  if (!Array.isArray(ingredientsList) || ingredientsList.length === 0) return null;

  const ingredientIds = ingredientsList
    .map((i) => i.ingredient?._id || i.ingredient)
    .filter(Boolean);

  const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } })
    .select('nutritionPer100g')
    .lean();

  const byId = new Map(ingredients.map((ig) => [String(ig._id), ig]));

  const totals = {
    calories: 0,
    macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
    micros: {},
  };
  for (const m of MICROS) totals.micros[m] = 0;

  for (const item of ingredientsList) {
    const id = String(item.ingredient?._id || item.ingredient);
    const ig = byId.get(id);
    if (!ig || !ig.nutritionPer100g) continue;

    const grams = Number(item.quantity) || 0; // grams per 100 g of recipe
    const factor = grams / 100;
    const n = ig.nutritionPer100g;

    totals.calories += (n.calories || 0) * factor;
    totals.macros.protein += (n.macros?.protein || 0) * factor;
    totals.macros.carbs += (n.macros?.carbs || 0) * factor;
    totals.macros.fat += (n.macros?.fat || 0) * factor;
    totals.macros.fiber += (n.macros?.fiber || 0) * factor;

    for (const m of MICROS) {
      totals.micros[m] += (n.micros?.[m] || 0) * factor;
    }
  }

  // Round everything
  totals.calories = Math.round(totals.calories * 10) / 10;
  for (const k of Object.keys(totals.macros)) {
    totals.macros[k] = Math.round(totals.macros[k] * 10) / 10;
  }
  for (const k of Object.keys(totals.micros)) {
    totals.micros[k] = Math.round(totals.micros[k] * 100) / 100;
  }

  return totals;
}

/**
 * Recalculate and persist nutritionPer100g on a saved recipe document.
 */
async function refreshRecipeNutrition(recipe) {
  if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) return recipe;

  const nutritionPer100g = await computeNutritionPer100g(recipe.ingredients);
  if (nutritionPer100g) {
    recipe.nutritionPer100g = nutritionPer100g;
    await recipe.save();
  }
  return recipe;
}

async function getAllRecipes() {
  return Recipe.find()
    .sort({ name: 1 })
    .populate('ingredients.ingredient')
    .populate('createdBy', 'name username email');
}

async function getRecipeByIdentifier(identifier) {
  let recipe;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    recipe = await Recipe.findById(identifier)
      .populate('ingredients.ingredient')
      .populate('createdBy', 'name username email');
  } else {
    recipe = await Recipe.findOne({ slug: identifier })
      .populate('ingredients.ingredient')
      .populate('createdBy', 'name username email');
  }

  if (!recipe) {
    const error = new Error('Recipe not found');
    error.status = 404;
    throw error;
  }

  return recipe;
}

async function createRecipe(data, userId) {
  const { name } = data || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('name is required');
    error.status = 400;
    throw error;
  }

  const slug = (data.slug && data.slug.trim()) || slugify(name, { lower: true, strict: true });

  const payload = {
    ...data,
    name: name.trim(),
    slug,
    createdBy: userId || data.createdBy || null
  };

  try {
    let recipe = await Recipe.create(payload);
    recipe = await refreshRecipeNutrition(recipe);
    return recipe;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('Recipe with this slug already exists');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function updateRecipeById(id, updates) {
  const data = { ...updates };

  if (data.name && !data.slug) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }

  try {
    let recipe = await Recipe.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!recipe) {
      const error = new Error('Recipe not found');
      error.status = 404;
      throw error;
    }

    // Recompute nutrition when ingredients change
    if (data.ingredients) {
      recipe = await refreshRecipeNutrition(recipe);
    }

    return recipe;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('Recipe with this slug already exists');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function deleteRecipeById(id) {
  const recipe = await Recipe.findByIdAndDelete(id);

  if (!recipe) {
    const error = new Error('Recipe not found');
    error.status = 404;
    throw error;
  }

  return recipe;
}

module.exports = {
  getAllRecipes,
  getRecipeByIdentifier,
  createRecipe,
  updateRecipeById,
  deleteRecipeById,
  computeNutritionPer100g,
  refreshRecipeNutrition,
};

