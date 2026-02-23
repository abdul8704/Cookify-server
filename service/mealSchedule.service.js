const MealSchedule = require('../models/MealSchedule.model');
const DailyIntake = require('../models/DailyIntake.model');
const Recipe = require('../models/Recipe.model');

const SLOT_ORDER = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Ensure a MealSchedule document exists for the given user + date.
 */
async function ensureSchedule(userId, date) {
    const d = date || todayString();
    let schedule = await MealSchedule.findOne({ userId, date: d });
    if (!schedule) {
        schedule = await MealSchedule.create({ userId, date: d });
    }
    return schedule;
}

/**
 * Populate recipe details on every meal entry.
 */
function populateSchedule(query) {
    return query.populate('meals.recipeId', 'name description nutritionPer100g servingSizeGrams tags mealType imageUrl difficulty totalDurationMinutes rating');
}

/**
 * Get (or create) a schedule for a single date, with recipe info populated.
 */
async function getScheduleForDate(userId, date) {
    const schedule = await ensureSchedule(userId, date);
    return populateSchedule(MealSchedule.findById(schedule._id));
}

/**
 * Get all schedules in a date range [startDate, endDate].
 */
async function getScheduleRange(userId, startDate, endDate) {
    return populateSchedule(
        MealSchedule.find({
            userId,
            date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 })
    );
}

/**
 * Add a recipe to a meal slot on a given date.
 */
async function addMealToSchedule(userId, date, recipeId, mealSlot) {
    if (!SLOT_ORDER.includes(mealSlot)) {
        throw new Error(`mealSlot must be one of: ${SLOT_ORDER.join(', ')}`);
    }

    const recipe = await Recipe.findById(recipeId).select('_id');
    if (!recipe) throw new Error('Recipe not found');

    const schedule = await ensureSchedule(userId, date);
    schedule.meals.push({ recipeId, mealSlot, completed: false });
    await schedule.save();

    return populateSchedule(MealSchedule.findById(schedule._id));
}

/**
 * Remove a scheduled meal entry by its subdocument _id.
 */
async function removeMealFromSchedule(userId, date, mealId) {
    const schedule = await MealSchedule.findOne({ userId, date });
    if (!schedule) throw new Error('Schedule not found');

    const idx = schedule.meals.findIndex((m) => String(m._id) === String(mealId));
    if (idx === -1) throw new Error('Meal entry not found');

    schedule.meals.splice(idx, 1);
    await schedule.save();

    return populateSchedule(MealSchedule.findById(schedule._id));
}

/**
 * Mark a scheduled meal as complete and log it into DailyIntake.
 */
async function markMealComplete(userId, date, mealId) {
    const schedule = await MealSchedule.findOne({ userId, date });
    if (!schedule) throw new Error('Schedule not found');

    const meal = schedule.meals.id(mealId);
    if (!meal) throw new Error('Meal entry not found');
    if (meal.completed) throw new Error('Meal already completed');

    // Mark complete
    meal.completed = true;
    meal.completedAt = new Date();
    await schedule.save();

    // Log into DailyIntake
    const recipe = await Recipe.findById(meal.recipeId).select(
        'nutritionPer100g servingSizeGrams'
    );

    if (recipe) {
        // Map schedule mealSlot to DailyIntake meal type (they use the same names)
        const intakeDate = date || todayString();
        let intake = await DailyIntake.findOne({ userId, date: intakeDate });
        if (!intake) {
            intake = await DailyIntake.create({ userId, date: intakeDate });
        }

        const gramsConsumed = recipe.servingSizeGrams || 100;
        const servings = 1;

        // Calculate nutrition snapshot
        const n = recipe.nutritionPer100g || {};
        const factor = gramsConsumed / 100;
        const macros = n.macros || {};
        const micros = n.micros || {};

        const nutritionSnapshot = {
            calories: (n.calories || 0) * factor,
            macros: {
                protein: (macros.protein || 0) * factor,
                carbs: (macros.carbs || 0) * factor,
                fat: (macros.fat || 0) * factor,
                fiber: (macros.fiber || 0) * factor,
            },
            micronutrients: {
                iron: (micros.iron || 0) * factor,
                calcium: (micros.calcium || 0) * factor,
                magnesium: (micros.magnesium || 0) * factor,
                potassium: (micros.potassium || 0) * factor,
                sodium: (micros.sodium || 0) * factor,
                zinc: (micros.zinc || 0) * factor,
                vitaminA: (micros.vitaminA || 0) * factor,
                vitaminC: (micros.vitaminC || 0) * factor,
                vitaminD: (micros.vitaminD || 0) * factor,
            },
        };

        intake.meals[meal.mealSlot].push({
            recipeId: meal.recipeId,
            gramsConsumed,
            servings,
            consumedAt: new Date(),
            nutritionSnapshot,
        });

        // Recalculate totals
        const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
        const totals = {
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
            micronutrients: {
                iron: 0, calcium: 0, magnesium: 0, potassium: 0,
                sodium: 0, zinc: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
            },
        };

        for (const mt of MEAL_TYPES) {
            for (const entry of intake.meals[mt] || []) {
                const snap = entry.nutritionSnapshot || {};
                totals.calories += snap.calories || 0;
                for (const k of ['protein', 'carbs', 'fat', 'fiber']) {
                    totals.macros[k] += snap.macros?.[k] || 0;
                }
                for (const k of Object.keys(totals.micronutrients)) {
                    totals.micronutrients[k] += snap.micronutrients?.[k] || 0;
                }
            }
        }
        intake.totals = totals;
        await intake.save();
    }

    return populateSchedule(MealSchedule.findById(schedule._id));
}

/**
 * Uncomplete a previously completed meal (toggle off).
 * Removes the corresponding DailyIntake entry and recalculates totals.
 */
async function uncompleteMeal(userId, date, mealId) {
    const schedule = await MealSchedule.findOne({ userId, date });
    if (!schedule) throw new Error('Schedule not found');

    const meal = schedule.meals.id(mealId);
    if (!meal) throw new Error('Meal entry not found');
    if (!meal.completed) throw new Error('Meal is not completed');

    meal.completed = false;
    meal.completedAt = null;
    await schedule.save();

    // Remove the last matching entry from DailyIntake for this recipe+slot
    const intakeDate = date || todayString();
    const intake = await DailyIntake.findOne({ userId, date: intakeDate });
    if (intake) {
        const entries = intake.meals[meal.mealSlot] || [];
        // Find the last entry with the same recipeId
        for (let i = entries.length - 1; i >= 0; i--) {
            if (String(entries[i].recipeId) === String(meal.recipeId)) {
                entries.splice(i, 1);
                break;
            }
        }

        // Recalculate totals
        const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
        const totals = {
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
            micronutrients: {
                iron: 0, calcium: 0, magnesium: 0, potassium: 0,
                sodium: 0, zinc: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
            },
        };
        for (const mt of MEAL_TYPES) {
            for (const entry of intake.meals[mt] || []) {
                const snap = entry.nutritionSnapshot || {};
                totals.calories += snap.calories || 0;
                for (const k of ['protein', 'carbs', 'fat', 'fiber']) {
                    totals.macros[k] += snap.macros?.[k] || 0;
                }
                for (const k of Object.keys(totals.micronutrients)) {
                    totals.micronutrients[k] += snap.micronutrients?.[k] || 0;
                }
            }
        }
        intake.totals = totals;
        await intake.save();
    }

    return populateSchedule(MealSchedule.findById(schedule._id));
}

/**
 * Get today's schedule with meals sorted by slot order,
 * pending (incomplete) slots first.
 */
async function getTodayPending(userId) {
    const date = todayString();
    const schedule = await populateSchedule(
        MealSchedule.findOne({ userId, date })
    );

    if (!schedule) return { date, meals: [], allDone: true };

    // Sort: incomplete first, in slot order
    const sorted = [...schedule.meals].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return SLOT_ORDER.indexOf(a.mealSlot) - SLOT_ORDER.indexOf(b.mealSlot);
    });

    const allDone = sorted.length > 0 && sorted.every((m) => m.completed);

    return {
        date,
        scheduleId: schedule._id,
        meals: sorted,
        allDone,
        totalMeals: sorted.length,
        completedMeals: sorted.filter((m) => m.completed).length,
    };
}

module.exports = {
    getScheduleForDate,
    getScheduleRange,
    addMealToSchedule,
    removeMealFromSchedule,
    markMealComplete,
    uncompleteMeal,
    getTodayPending,
};

