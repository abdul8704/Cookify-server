const UserProfile = require('../models/UserProfile.model');
const nutritionService = require('../service/nutrition.service');

function normalizeGoalValue(input) {
  if (typeof input !== 'string') return input;
  const compact = input.toLowerCase().replace(/[\s_-]/g, '');
  if (compact === 'weightloss' || compact === 'fatloss') return 'weightloss';
  if (compact === 'weightgain' || compact === 'musclegain') return 'weightgain';
  if (compact === 'maintain' || compact === 'maintainweight') return 'maintain';
  return input;
}

/**
 * GET /api/profile/me
 * Get the current user's profile (creates a blank one if none exists)
 */
const getMyProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await UserProfile.create({ userId: req.user.id });
    }
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/profile/me
 * Update (or create) the current user's profile
 */
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      'displayName',
      'bio',
      'avatarUrl',
      'phone',
      'dateOfBirth',
      'gender',
      'goals',
      'height',
      'weight',
      'activityLevel',
      'dietaryPreferences',
      'allergies',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.goals !== undefined) {
      updates.goals = normalizeGoalValue(updates.goals);
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No valid fields provided' });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    try {
      await nutritionService.syncAutoGoalsForUser(req.user.id, profile);
    } catch (nutritionErr) {
      console.error('Nutrition goals auto-sync error:', nutritionErr);
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.name === 'ValidationError') {
      return res
        .status(400)
        .json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMyProfile, updateMyProfile };
