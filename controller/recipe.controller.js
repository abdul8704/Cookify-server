const recipeService = require('../service/recipe.service');

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await recipeService.getAllRecipes();
    return res.status(200).json({ success: true, data: recipes });
  } catch (err) {
    console.error('Get all recipes error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const recipe = await recipeService.getRecipeByIdentifier(identifier);
    return res.status(200).json({ success: true, data: recipe });
  } catch (err) {
    console.error('Get recipe by id error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

const createRecipe = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const recipe = await recipeService.createRecipe(req.body || {}, userId);
    return res.status(201).json({ success: true, data: recipe });
  } catch (err) {
    console.error('Create recipe error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.updateRecipeById(id, req.body || {});
    return res.status(200).json({ success: true, data: recipe });
  } catch (err) {
    console.error('Update recipe error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    await recipeService.deleteRecipeById(id);
    return res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
  } catch (err) {
    console.error('Delete recipe error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
};
