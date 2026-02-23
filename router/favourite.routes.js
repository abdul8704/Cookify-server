const express = require('express');
const router = express.Router();
const FavouriteController = require('../controller/favourite.controller');

// All routes require auth (handled by global middleware)

router.get('/', FavouriteController.getMyFavourites);
router.get('/ids', FavouriteController.getMyFavouriteIds);
router.post('/:recipeId/toggle', FavouriteController.toggleFavourite);
router.post('/:recipeId/rate', FavouriteController.rateRecipe);

module.exports = router;
