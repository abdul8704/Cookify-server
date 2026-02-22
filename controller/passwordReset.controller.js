const passwordResetService = require('../service/passwordReset.service');

const forgotPassword = async (req, res) => {
  try {
    const result = await passwordResetService.forgotPassword(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const result = await passwordResetService.verifyOTP(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await passwordResetService.resetUserPassword(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
};

module.exports = {
  forgotPassword,
  verifyOTP,
  resetPassword,
};
