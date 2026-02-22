const express = require('express');
const router = express.Router();
const RecipeController = require('../controller/recipe.controller');
const RecipeValidation = require('../validation/recipe.validation');
const requireAdmin = require('../middleware/admin.middleware');

// Public read endpoints
router.get('/', RecipeController.getAllRecipes);
router.get('/:id', RecipeValidation.validateIdParam, RecipeController.getRecipeById);

// Admin-only write endpoints
router.post('/', requireAdmin, RecipeValidation.validateCreateRecipe, RecipeController.createRecipe);
router.put('/:id', requireAdmin, RecipeValidation.validateUpdateRecipe, RecipeController.updateRecipe);
router.delete('/:id', requireAdmin, RecipeValidation.validateDeleteRecipe, RecipeController.deleteRecipe);

module.exports = router;
