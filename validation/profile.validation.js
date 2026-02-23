function validateProfileUpdate(req, res, next) {
  const {
    displayName,
    bio,
    phone,
    gender,
    goals,
    height,
    weight,
    activityLevel,
    dietaryPreferences,
    allergies,
  } = req.body || {};

  if (displayName !== undefined && typeof displayName !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'displayName must be a string' });
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'bio must be a string' });
    }
    if (bio.length > 300) {
      return res
        .status(400)
        .json({ success: false, message: 'bio must be at most 300 characters' });
    }
  }

  if (phone !== undefined && typeof phone !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'phone must be a string' });
  }

  if (
    gender !== undefined &&
    !['male', 'female', 'other', ''].includes(gender)
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'gender must be male, female, other, or empty' });
  }

  if (
    goals !== undefined &&
    !['weightloss', 'weightgain', 'maintain'].includes(goals)
  ) {
    return res.status(400).json({
      success: false,
      message: 'goals must be one of: weightloss, weightgain, maintain',
    });
  }

  if (height !== undefined && height !== null) {
    if (typeof height !== 'number' || height < 0) {
      return res
        .status(400)
        .json({ success: false, message: 'height must be a non-negative number (cm)' });
    }
  }

  if (weight !== undefined && weight !== null) {
    if (typeof weight !== 'number' || weight < 0) {
      return res
        .status(400)
        .json({ success: false, message: 'weight must be a non-negative number (kg)' });
    }
  }

  if (
    activityLevel !== undefined &&
    !['sedentary', 'light', 'moderate', 'active', 'very_active', ''].includes(
      activityLevel
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        'activityLevel must be one of: sedentary, light, moderate, active, very_active, or empty',
    });
  }

  if (dietaryPreferences !== undefined && !Array.isArray(dietaryPreferences)) {
    return res.status(400).json({
      success: false,
      message: 'dietaryPreferences must be an array of strings',
    });
  }

  if (allergies !== undefined && !Array.isArray(allergies)) {
    return res.status(400).json({
      success: false,
      message: 'allergies must be an array of strings',
    });
  }

  return next();
}

module.exports = { validateProfileUpdate };
