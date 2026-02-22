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

function validateCreateIngredient(req, res, next) {
  const { name, nutritionPer100g } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return sendBadRequest(res, 'name is required');
  }

  if (!nutritionPer100g || typeof nutritionPer100g !== 'object') {
    return sendBadRequest(res, 'nutritionPer100g is required');
  }

  if (typeof nutritionPer100g.calories !== 'number') {
    return sendBadRequest(res, 'nutritionPer100g.calories must be a number');
  }

  return next();
}

function validateUpdateIngredient(req, res, next) {
  const { id } = req.params || {};
  if (!id) {
    return sendBadRequest(res, 'id param is required');
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return sendBadRequest(res, 'at least one field is required to update');
  }

  return next();
}

function validateDeleteIngredient(req, res, next) {
  const { id } = req.params || {};
  if (!id) {
    return sendBadRequest(res, 'id param is required');
  }
  return next();
}

function validateSearchIngredient(req, res, next) {
  const { q } = req.query || {};
  if (!q || typeof q !== 'string' || !q.trim()) {
    return sendBadRequest(res, 'query param "q" is required');
  }
  if (q.trim().length < 2) {
    return sendBadRequest(res, 'search query must be at least 2 characters');
  }
  return next();
}

module.exports = {
  validateIdParam,
  validateCreateIngredient,
  validateUpdateIngredient,
  validateDeleteIngredient,
  validateSearchIngredient
};
