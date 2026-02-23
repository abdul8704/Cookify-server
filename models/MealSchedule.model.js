const mongoose = require('mongoose');

const scheduledMealSchema = new mongoose.Schema({
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true,
    },
    mealSlot: {
        type: String,
        enum: ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'],
        required: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
        default: null,
    },
});

const mealScheduleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        date: {
            type: String,
            required: true,
            index: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },
        meals: {
            type: [scheduledMealSchema],
            default: () => [],
        },
    },
    { timestamps: true }
);

mealScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealSchedule', mealScheduleSchema);
