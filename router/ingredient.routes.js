const express = require('express');
const router = express.Router();
const IngredientController = require('../controller/ingredient.controller');
const IngredientValidation = require('../validation/ingredient.validation');
const requireAdmin = require('../middleware/admin.middleware');

router.get('/', IngredientController.getAllIngredients);
router.get('/search', IngredientValidation.validateSearchIngredient, IngredientController.searchIngredients);
router.get('/:id', IngredientValidation.validateIdParam, IngredientController.getIngredientById);
router.post('/', requireAdmin, IngredientValidation.validateCreateIngredient, IngredientController.createIngredient);
router.put('/:id', requireAdmin, IngredientValidation.validateUpdateIngredient, IngredientController.updateIngredient);
router.delete('/:id', requireAdmin, IngredientValidation.validateDeleteIngredient, IngredientController.deleteIngredient);

module.exports = router;
