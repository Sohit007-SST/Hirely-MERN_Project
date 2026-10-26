const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register - Session 7
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Admin accounts can never be self-registered (also blocked by the validator)
  const safeRole = role === 'client' ? 'client' : 'freelancer';

  const exists = await User.exists({ email });
  if (exists) throw new ApiError(400, 'An account with this email already exists');

  const user = await User.create({ name, email, password, role: safeRole });
  res.status(201).json({ success: true, token: generateToken(user._id), user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Email or password is incorrect');
  }
  if (user.isBanned) throw new ApiError(403, 'Your account has been suspended. Contact support for help');

  res.json({ success: true, token: generateToken(user._id), user });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, getMe };
