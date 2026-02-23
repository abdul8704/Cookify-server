const express = require('express');
const router = express.Router();
const NutritionController = require('../controller/nutrition.controller');

router.get('/goals', NutritionController.getGoals);
router.put('/goals', NutritionController.updateGoals);

router.get('/intake', NutritionController.getIntake);
router.post('/intake/meal', NutritionController.addMeal);
router.patch('/intake/meal', NutritionController.updateMeal);
router.delete('/intake/meal', NutritionController.removeMeal);

module.exports = router;
