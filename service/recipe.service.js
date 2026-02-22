const mongoose = require('mongoose');
const slugify = require('slugify');
const Recipe = require('../models/Recipe.model');

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
    const recipe = await Recipe.create(payload);
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
    const recipe = await Recipe.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!recipe) {
      const error = new Error('Recipe not found');
      error.status = 404;
      throw error;
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
  deleteRecipeById
};
