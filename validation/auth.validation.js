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

module.exports = {
  validateRegister,
  validateLogin,
};
