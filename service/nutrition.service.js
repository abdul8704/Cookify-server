const NutritionGoals = require('../models/NutritionGoals.model');
const UserProfile = require('../models/UserProfile.model');

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const MICRONUTRIENT_TARGETS = {
  male: {
    iron: 8,
    calcium: 1000,
    magnesium: 420,
    potassium: 3400,
    sodium: 2300,
    zinc: 11,
    vitaminA: 900,
    vitaminC: 90,
    vitaminD: 15,
  },
  female: {
    iron: 18,
    calcium: 1000,
    magnesium: 320,
    potassium: 2600,
    sodium: 2300,
    zinc: 8,
    vitaminA: 700,
    vitaminC: 75,
    vitaminD: 15,
  },
  other: {
    iron: 10,
    calcium: 1000,
    magnesium: 370,
    potassium: 3000,
    sodium: 2300,
    zinc: 10,
    vitaminA: 800,
    vitaminC: 85,
    vitaminD: 15,
  },
};

function normalizeGoal(input) {
  if (typeof input !== 'string') return 'maintain';
  const compact = input.toLowerCase().replace(/[\s_-]/g, '');
  if (compact === 'weightloss' || compact === 'fatloss') return 'weightloss';
  if (compact === 'weightgain' || compact === 'musclegain') return 'weightgain';
  return 'maintain';
}

function round(value) {
  return Math.round(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getAgeYears(dateOfBirth) {
  if (!dateOfBirth) return 30;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 30;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;

  return clamp(age, 13, 90);
}

function toProfileData(profile) {
  if (!profile) return {};
  if (typeof profile.toObject === 'function') return profile.toObject();
  return profile;
}

function computeNutritionTargets(profileInput) {
  const profile = toProfileData(profileInput);

  const gender = ['male', 'female', 'other'].includes(profile.gender)
    ? profile.gender
    : 'other';

  const goalType = normalizeGoal(profile.goals);
  const height = typeof profile.height === 'number' && profile.height > 0 ? profile.height : 170;
  const weight = typeof profile.weight === 'number' && profile.weight > 0 ? profile.weight : 70;
  const age = getAgeYears(profile.dateOfBirth);
  const activity = ACTIVITY_MULTIPLIERS[profile.activityLevel] || ACTIVITY_MULTIPLIERS.sedentary;

  const genderAdjustment = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderAdjustment;
  const tdee = bmr * activity;

  let calorieDelta = 0;
  if (goalType === 'weightloss') calorieDelta = -500;
  if (goalType === 'weightgain') calorieDelta = 300;

  const dailyCalories = round(clamp(tdee + calorieDelta, 1200, 5000));

  const proteinPerKg = goalType === 'weightloss' ? 1.8 : goalType === 'weightgain' ? 1.7 : 1.4;
  const protein = round(Math.max(weight * proteinPerKg, 90));
  const fat = round(Math.max(weight * 0.8, 50));
  const remainingCalories = Math.max(dailyCalories - protein * 4 - fat * 9, 0);
  const carbs = round(Math.max(remainingCalories / 4, 100));
  const fiber = round(Math.max((dailyCalories / 1000) * 14, 25));

  return {
    goalType,
    dailyCalories,
    macros: {
      protein,
      carbs,
      fat,
      fiber,
    },
    micronutrients: { ...MICRONUTRIENT_TARGETS[gender] },
    computedFromProfile: {
      age,
      height,
      weight,
      activityLevel: profile.activityLevel || '',
      gender,
      goals: goalType,
    },
  };
}

async function syncAutoGoalsForUser(userId, profileOverride = null) {
  const existing = await NutritionGoals.findOne({ userId });
  if (existing && existing.source === 'manual') {
    return existing;
  }

  let profile = profileOverride;
  if (!profile) {
    profile = await UserProfile.findOne({ userId });
  }

  const computed = computeNutritionTargets(profile || {});

  const goals = await NutritionGoals.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...computed,
        source: 'auto',
        lastComputedAt: new Date(),
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return goals;
}

module.exports = {
  syncAutoGoalsForUser,
  computeNutritionTargets,
  normalizeGoal,
};
