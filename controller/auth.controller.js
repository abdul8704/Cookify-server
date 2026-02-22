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

const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const available = await authService.isUsernameAvailable(username);
    return res.status(200).json({ success: true, available });
  } catch (err) {
    console.error('Check username error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);

    console.log('Login successful for user:', result.user.email);
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

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = await authService.refreshAccessToken(refreshToken);
    return res.status(200).json({ success: true, accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};
    
const logout = async (req, res) => {
  try {
    // Clear any server-side cookies
    res.clearCookie('token');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  checkUsername,
  refresh,
  logout
};