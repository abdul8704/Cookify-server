function sendBadRequest(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

function validateForgotPassword(req, res, next) {
  const { email, username } = req.body || {};

  if (!email && !username) {
    return sendBadRequest(res, 'Either email or username is required');
  }

  return next();
}

function validateVerifyOTP(req, res, next) {
  const { email, otp } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    return sendBadRequest(res, 'email is required');
  }
  if (!otp || typeof otp !== 'string' || !otp.trim()) {
    return sendBadRequest(res, 'OTP is required');
  }
  if (otp.trim().length !== 6) {
    return sendBadRequest(res, 'OTP must be 6 digits');
  }

  return next();
}

function validateResetPassword(req, res, next) {
  const { email, resetToken, newPassword } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    return sendBadRequest(res, 'email is required');
  }
  if (!resetToken || typeof resetToken !== 'string' || !resetToken.trim()) {
    return sendBadRequest(res, 'resetToken is required');
  }
  if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) {
    return sendBadRequest(res, 'newPassword is required');
  }
  if (newPassword.length < 6) {
    return sendBadRequest(res, 'Password must be at least 6 characters');
  }

  return next();
}

module.exports = {
  validateForgotPassword,
  validateVerifyOTP,
  validateResetPassword,
};
