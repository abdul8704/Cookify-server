function sendBadRequest(res, message) {
  return res.status(400).json({
    success: false,
    message
  });
}

function validateIdParam(req, res, next) {
  const { id } = req.params || {};
  if (!id) {
    return sendBadRequest(res, 'id param is required');
  }
  return next();
}

function validateCreateRecipe(req, res, next) {
  const { name, ingredients, steps, servings } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return sendBadRequest(res, 'name is required');
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return sendBadRequest(res, 'ingredients array is required and cannot be empty');
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return sendBadRequest(res, 'steps array is required and cannot be empty');
  }

  if (servings !== undefined && (typeof servings !== 'number' || servings <= 0)) {
    return sendBadRequest(res, 'servings must be a positive number');
  }

  return next();
}

function validateUpdateRecipe(req, res, next) {
  const { id } = req.params || {};
  if (!id) {
    return sendBadRequest(res, 'id param is required');
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return sendBadRequest(res, 'at least one field is required to update');
  }

  if (req.body.servings !== undefined) {
    if (typeof req.body.servings !== 'number' || req.body.servings <= 0) {
      return sendBadRequest(res, 'servings must be a positive number');
    }
  }

  return next();
}

function validateDeleteRecipe(req, res, next) {
  const { id } = req.params || {};
  if (!id) {
    return sendBadRequest(res, 'id param is required');
  }
  return next();
}

module.exports = {
  validateIdParam,
  validateCreateRecipe,
  validateUpdateRecipe,
  validateDeleteRecipe
};
