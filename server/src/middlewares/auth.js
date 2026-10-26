const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.split(' ')[1] : null;
};

// Session 7: protected routes - verify the JWT and attach req.user
const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) throw new ApiError(401, 'Please log in to continue');

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT errors -> errorHandler -> 401
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Your session has expired. Please log in again');
  if (user.isBanned) throw new ApiError(403, 'Your account has been suspended. Contact support for help');

  req.user = user;
  next();
});

// Public routes that personalise the answer when a valid token is present (e.g. isFollowing)
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBanned) req.user = user;
  } catch {
    // An invalid token on a public route is simply ignored
  }
  next();
});

// Session 7: role-based authorization, e.g. authorize('client') or authorize('admin')
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, `Only ${roles.join(' or ')} accounts can do this`));
    }
    next();
  };

module.exports = { protect, optionalAuth, authorize };
