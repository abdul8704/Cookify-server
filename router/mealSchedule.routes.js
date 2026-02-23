const express = require('express');
const router = express.Router();
const MealScheduleController = require('../controller/mealSchedule.controller');

router.get('/', MealScheduleController.getSchedule);
router.get('/range', MealScheduleController.getScheduleRange);
router.get('/today/pending', MealScheduleController.getTodayPending);

router.post('/meal', MealScheduleController.addMeal);
router.delete('/meal', MealScheduleController.removeMeal);
router.patch('/meal/complete', MealScheduleController.completeMeal);
router.patch('/meal/uncomplete', MealScheduleController.uncompleteMeal);

module.exports = router;
