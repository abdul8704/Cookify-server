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

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const error = new Error('User with this email or username already exists');
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
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
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
      email: user.email
    }
  };
}

module.exports = {
  registerUser,
  loginUser
};
