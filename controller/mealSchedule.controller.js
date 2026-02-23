const mealScheduleService = require('../service/mealSchedule.service');

// GET /api/meal-schedule?date=YYYY-MM-DD
exports.getSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const date = req.query.date || new Date().toISOString().slice(0, 10);
        const schedule = await mealScheduleService.getScheduleForDate(userId, date);
        return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
        console.error('Get schedule error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// GET /api/meal-schedule/range?start=YYYY-MM-DD&end=YYYY-MM-DD
exports.getScheduleRange = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ success: false, message: 'start and end query params required' });
        }
        const schedules = await mealScheduleService.getScheduleRange(userId, start, end);
        return res.status(200).json({ success: true, data: schedules });
    } catch (err) {
        console.error('Get schedule range error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// POST /api/meal-schedule/meal
// Body: { date, recipeId, mealSlot }
exports.addMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, recipeId, mealSlot } = req.body || {};

        if (!recipeId) {
            return res.status(400).json({ success: false, message: 'recipeId is required' });
        }
        if (!mealSlot) {
            return res.status(400).json({ success: false, message: 'mealSlot is required' });
        }

        const schedule = await mealScheduleService.addMealToSchedule(
            userId,
            date || new Date().toISOString().slice(0, 10),
            recipeId,
            mealSlot
        );
        return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
        console.error('Add scheduled meal error:', err);
        const status = err.message === 'Recipe not found' ? 404 : 400;
        return res.status(status).json({ success: false, message: err.message || 'Server error' });
    }
};

// DELETE /api/meal-schedule/meal
// Body: { date, mealId }
exports.removeMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, mealId } = req.body || {};

        if (!date || !mealId) {
            return res.status(400).json({ success: false, message: 'date and mealId are required' });
        }

        const schedule = await mealScheduleService.removeMealFromSchedule(userId, date, mealId);
        return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
        console.error('Remove scheduled meal error:', err);
        return res.status(400).json({ success: false, message: err.message || 'Server error' });
    }
};

// PATCH /api/meal-schedule/meal/complete
// Body: { date, mealId }
exports.completeMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, mealId } = req.body || {};

        if (!date || !mealId) {
            return res.status(400).json({ success: false, message: 'date and mealId are required' });
        }

        const schedule = await mealScheduleService.markMealComplete(userId, date, mealId);
        return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
        console.error('Complete meal error:', err);
        return res.status(400).json({ success: false, message: err.message || 'Server error' });
    }
};

// PATCH /api/meal-schedule/meal/uncomplete
// Body: { date, mealId }
exports.uncompleteMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, mealId } = req.body || {};

        if (!date || !mealId) {
            return res.status(400).json({ success: false, message: 'date and mealId are required' });
        }

        const schedule = await mealScheduleService.uncompleteMeal(userId, date, mealId);
        return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
        console.error('Uncomplete meal error:', err);
        return res.status(400).json({ success: false, message: err.message || 'Server error' });
    }
};

// GET /api/meal-schedule/today/pending
exports.getTodayPending = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await mealScheduleService.getTodayPending(userId);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error('Get today pending error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

