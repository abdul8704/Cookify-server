const ingredientService = require('../service/ingredient.service');

const getAllIngredients = async (req, res) => {
  try {
    const ingredients = await ingredientService.getAllIngredients();
    return res.status(200).json({ success: true, data: ingredients });
  } catch (err) {
    console.error('Get all ingredients error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const searchIngredients = async (req, res) => {
  try {
    const results = await ingredientService.searchIngredients(req.query.q.trim());
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('Search ingredients error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getIngredientById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const ingredient = await ingredientService.getIngredientByIdentifier(identifier);
    return res.status(200).json({ success: true, data: ingredient });
  } catch (err) {
    console.error('Get ingredient by id error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

const createIngredient = async (req, res) => {
  try {
    const ingredient = await ingredientService.createIngredient(req.body || {});
    return res.status(201).json({ success: true, data: ingredient });
  } catch (err) {
    console.error('Create ingredient error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await ingredientService.updateIngredientById(id, req.body || {});
    return res.status(200).json({ success: true, data: ingredient });
  } catch (err) {
    console.error('Update ingredient error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    await ingredientService.deleteIngredientById(id);
    return res.status(200).json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (err) {
    console.error('Delete ingredient error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  getAllIngredients,
  searchIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient
};
