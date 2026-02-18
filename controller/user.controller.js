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
    const { name, username, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, username, email },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
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