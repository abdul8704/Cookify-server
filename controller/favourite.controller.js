const Favourite = require('../models/Favourite.model');
const Rating = require('../models/Rating.model');
const Recipe = require('../models/Recipe.model');

// ── Favourites ─────────────────────────────────────────────

/**
 * GET /api/favourites
 * Return all favourite recipes for the logged-in user (populated).
 */
const getMyFavourites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favs = await Favourite.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'recipeId',
        populate: { path: 'ingredients.ingredient' },
      });

    const recipes = favs
      .filter((f) => f.recipeId) // skip if recipe was deleted
      .map((f) => f.recipeId);

    return res.status(200).json({ success: true, data: recipes });
  } catch (err) {
    console.error('Get favourites error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/favourites/ids
 * Return just the recipe IDs the user has favourited (lightweight).
 */
const getMyFavouriteIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const favs = await Favourite.find({ userId }).select('recipeId');
    const ids = favs.map((f) => f.recipeId.toString());
    return res.status(200).json({ success: true, data: ids });
  } catch (err) {
    console.error('Get favourite ids error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/favourites/:recipeId/toggle
 * Add to favourites if not present, remove if present. Returns new state.
 */
const toggleFavourite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeId } = req.params;

    const existing = await Favourite.findOne({ userId, recipeId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ success: true, favourited: false, message: 'Removed from favourites' });
    }

    await Favourite.create({ userId, recipeId });
    return res.status(201).json({ success: true, favourited: true, message: 'Added to favourites' });
  } catch (err) {
    console.error('Toggle favourite error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Ratings ────────────────────────────────────────────────

/**
 * POST /api/favourites/:recipeId/rate
 * Body: { score: 1-5, comment?: string }
 * Creates or updates the user's rating, then recalculates the recipe average.
 */
const rateRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeId } = req.params;
    const { score, comment } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 5' });
    }

    // Upsert rating
    await Rating.findOneAndUpdate(
      { userId, recipeId },
      { score: Number(score), comment: comment || '' },
      { upsert: true, new: true },
    );

    // Recalculate recipe average
    const agg = await Rating.aggregate([
      { $match: { recipeId: require('mongoose').Types.ObjectId.createFromHexString(recipeId) } },
      { $group: { _id: null, average: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const avg = agg.length ? agg[0].average : 0;
    const cnt = agg.length ? agg[0].count : 0;

    await Recipe.findByIdAndUpdate(recipeId, {
      'rating.average': Math.round(avg * 10) / 10,
      'rating.count': cnt,
    });

    return res.status(200).json({
      success: true,
      message: 'Rating submitted',
      data: { average: Math.round(avg * 10) / 10, count: cnt },
    });
  } catch (err) {
    console.error('Rate recipe error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyFavourites,
  getMyFavouriteIds,
  toggleFavourite,
  rateRecipe,
};
