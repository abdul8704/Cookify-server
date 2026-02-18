const authService = require('../service/auth.service');

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};
    
module.exports = {
  register,
  login
};