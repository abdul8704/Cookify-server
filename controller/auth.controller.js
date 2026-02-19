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
    const { token, refreshToken } = result;

    // Set access token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (process.env.JWT_ACCESS_MAXAGE_MINUTES
        ? Number(process.env.JWT_ACCESS_MAXAGE_MINUTES) * 60 * 1000
        : 15 * 60 * 1000)
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (process.env.JWT_REFRESH_MAXAGE_DAYS
        ? Number(process.env.JWT_REFRESH_MAXAGE_DAYS) * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000)
    });

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