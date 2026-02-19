const mongoose = require('mongoose');
const slugify = require('slugify');
const Ingredient = require('../models/Ingredient.model');

async function getAllIngredients() {
  return Ingredient.find().sort({ name: 1 });
}

async function getIngredientByIdentifier(identifier) {
  let ingredient;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    ingredient = await Ingredient.findById(identifier);
  } else {
    ingredient = await Ingredient.findOne({ slug: identifier });
  }

  if (!ingredient) {
    const error = new Error('Ingredient not found');
    error.status = 404;
    throw error;
  }

  return ingredient;
}

async function createIngredient(data) {
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
    slug
  };

  try {
    const ingredient = await Ingredient.create(payload);
    return ingredient;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('Ingredient with this slug already exists');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function updateIngredientById(id, updates) {
  const data = { ...updates };

  if (data.name && !data.slug) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }

  try {
    const ingredient = await Ingredient.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });

    if (!ingredient) {
      const error = new Error('Ingredient not found');
      error.status = 404;
      throw error;
    }

    return ingredient;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('Ingredient with this slug already exists');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function deleteIngredientById(id) {
  const ingredient = await Ingredient.findByIdAndDelete(id);

  if (!ingredient) {
    const error = new Error('Ingredient not found');
    error.status = 404;
    throw error;
  }

  return ingredient;
}

module.exports = {
  getAllIngredients,
  getIngredientByIdentifier,
  createIngredient,
  updateIngredientById,
  deleteIngredientById
};
