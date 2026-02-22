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

function validateCreateOrUpdateInventory(req, res, next) {
  const { ingredientId, type } = req.body || {};

  if (!ingredientId || typeof ingredientId !== 'string' || !ingredientId.trim()) {
    return sendBadRequest(res, 'ingredientId is required');
  }

  const allowedTypes = ['meat','fruit', 'vegetable', 'spice', 'breakfast' ,'snack', 'lunch', 'dinner', 'oil', 'other'];
  if (type && !allowedTypes.includes(type)) {
    return sendBadRequest(res, `type must be one of: ${allowedTypes.join(', ')}`);
  }

  return next();
}

function validateUpdateInventory(req, res, next) {
  const { id } = req.params || {};
  if (!id) {
    return sendBadRequest(res, 'id param is required');
  }

  const body = req.body || {};
  if (!body || Object.keys(body).length === 0) {
    return sendBadRequest(res, 'at least one field is required to update');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'type')) {
    const allowedTypes = ['meat', 'fruit', 'vegetable', 'spice', 'breakfast' ,'snack', 'lunch', 'dinner', 'oil', 'other'];
    if (!allowedTypes.includes(body.type)) {
      return sendBadRequest(res, `type must be one of: ${allowedTypes.join(', ')}`);
    }
  }

  return next();
}

module.exports = {
  validateIdParam,
  validateCreateOrUpdateInventory,
  validateUpdateInventory
};
