const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
require('dotenv').config();

async function registerUser({ name, username, email, password, role }) {
  if (!name || !username || !email || !password) {
    const error = new Error('Name, username, email and password are required');
    error.status = 400;
    throw error;
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const error = new Error('An account with this email already exists');
    error.status = 409;
    throw error;
  }

  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    const error = new Error('This username is already taken');
    error.status = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    username,
    email,
    passwordHash,
    role: role === 'admin' ? 'admin' : 'user'
  });

  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };
}

async function loginUser({ username, email, password }) {
  if (!username && !email || !password) {
    const error = new Error('Either username or email and password are required');
    error.status = 400;
    throw error;
  }
  let query;
  if (email) {
    query = { email: email.toLowerCase() };
  } else if (username) {
    query = { username };
  }

  const user = await User.findOne(query);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    console.error('Login error: user not found -', query);
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    console.error('Login error: wrong password for user -', user.email);
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      tokenType: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
}

async function isUsernameAvailable(username) {
  if (!username) {
    const error = new Error('Username is required');
    error.status = 400;
    throw error;
  }
  const existing = await User.findOne({ username: username.toLowerCase() });
  return !existing;
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.status = 400;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 401;
    throw error;
  }

  if (payload.tokenType !== 'refresh') {
    const error = new Error('Invalid token type');
    error.status = 401;
    throw error;
  }

  // Verify user still exists
  const user = await User.findById(payload.id);
  if (!user) {
    const error = new Error('User no longer exists');
    error.status = 401;
    throw error;
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  return accessToken;
}

module.exports = {
  registerUser,
  loginUser,
  isUsernameAvailable,
  refreshAccessToken
};
