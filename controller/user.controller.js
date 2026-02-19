const User = require('../models/User.model');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
	const identifier = req.params.id;

	let query;

	// Treat as email if it looks like an email
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (emailRegex.test(identifier)) {
		query = { email: identifier.toLowerCase() };
	} else {
		// Otherwise treat as username
		query = { username: identifier };
	}

	const user = await User.findOne(query).select('-passwordHash');
	if (!user) {
		return res.status(404).json({ success: false, message: 'User not found' });
	}
	return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Get user by id error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    // Delegate hashing / validation to auth flow; here we expect passwordHash
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, username, email and password are required' });
    }
    return res.status(400).json({ success: false, message: 'Use /api/auth/register to create users' });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const identifier = req.params.id;
    const { name, username, email } = req.body || {};

    // Build lookup query based on whether identifier is email or username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let query;
    if (emailRegex.test(identifier)) {
      query = { email: identifier.toLowerCase() };
    } else {
      query = { username: identifier };
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If email is being changed, ensure new email is not already in use
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmailUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingEmailUser) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    // If username is being changed, ensure new username is not already in use
    if (username && username !== user.username) {
      const existingUsernameUser = await User.findOne({
        username,
        _id: { $ne: user._id }
      });
      if (existingUsernameUser) {
        return res.status(409).json({ success: false, message: 'Username already in use' });
      }
    }

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (typeof username === 'string' && username.trim()) {
      user.username = username.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      user.email = email.toLowerCase().trim();
    }

    const updatedUser = await user.save();

    const safeUser = updatedUser.toObject();
    delete safeUser.passwordHash;

    return res.status(200).json({ success: true, data: safeUser });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const identifier = req.params.id;

    // Build lookup query based on whether identifier is email or username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let query;
    if (emailRegex.test(identifier)) {
      query = { email: identifier.toLowerCase() };
    } else {
      query = { username: identifier };
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure a user can only delete their own account
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own account' });
    }

    await user.deleteOne();

    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};