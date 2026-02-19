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
  const { ingredientId, type, quantity, units } = req.body || {};

  if (!ingredientId || typeof ingredientId !== 'string' || !ingredientId.trim()) {
    return sendBadRequest(res, 'ingredientId is required');
  }

  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    return sendBadRequest(res, 'quantity must be a number');
  }

  if (quantity < 0) {
    return sendBadRequest(res, 'quantity must be greater than or equal to 0');
  }

  if (!units || typeof units !== 'string' || !units.trim()) {
    return sendBadRequest(res, 'units is required');
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

  if (Object.prototype.hasOwnProperty.call(body, 'quantity')) {
    if (typeof body.quantity !== 'number' || Number.isNaN(body.quantity)) {
      return sendBadRequest(res, 'quantity must be a number');
    }
    if (body.quantity < 0) {
      return sendBadRequest(res, 'quantity must be greater than or equal to 0');
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'units')) {
    if (!body.units || typeof body.units !== 'string' || !body.units.trim()) {
      return sendBadRequest(res, 'units must be a non-empty string');
    }
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
