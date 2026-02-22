function sendBadRequest(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

function validateRegister(req, res, next) {
  const { name, username, email, password } = req.body || {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return sendBadRequest(res, "name is required");
  }
  if (!username || typeof username !== "string" || !username.trim()) {
    return sendBadRequest(res, "username is required");
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return sendBadRequest(res, "email is required");
  }
  if (!password || typeof password !== "string" || !password.trim()) {
    return sendBadRequest(res, "password is required");
  }

  return next();
}

function validateLogin(req, res, next) {
  const { username, email, password } = req.body || {};

  if (!username && !email) {
    return sendBadRequest(res, "Either username or email is required");
  }
  if (!password || typeof password !== "string" || !password.trim()) {
    return sendBadRequest(res, "password is required");
  }

  return next();
}

function validateCheckUsername(req, res, next) {
  const { username } = req.body || {};
  if (!username || typeof username !== "string" || !username.trim()) {
    return sendBadRequest(res, "username is required");
  }
  if (username.trim().length < 3) {
    return sendBadRequest(res, "username must be at least 3 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return sendBadRequest(res, "username can only contain letters, numbers, and underscores");
  }
  return next();
}

function validateRefresh(req, res, next) {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== "string" || !refreshToken.trim()) {
    return sendBadRequest(res, "refreshToken is required");
  }
  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCheckUsername,
  validateRefresh,
};
