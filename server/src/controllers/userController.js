const User = require('../models/User');
const Gig = require('../models/Gig');
const Review = require('../models/Review');
const appEvents = require('../events/appEvents');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, pageMeta, escapeRegex } = require('../utils/pagination');
const { isCloudinaryConfigured, uploadBuffer, deleteImage } = require('../config/cloudinary');

const USER_CARD = 'name avatar headline role rating';
const PROFILE_FIELDS = ['name', 'headline', 'bio', 'skills', 'hourlyRate', 'location'];

// GET /api/users/freelancers?q=&skill=&page= - Session 9: search + pagination
const listFreelancers = asyncHandler(async (req, res) => {
  const { q, skill } = req.query;
  const { page, limit, skip } = getPagination(req.query, 12);

  const filter = { role: 'freelancer', isBanned: false };
  if (typeof q === 'string' && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: regex }, { headline: regex }, { skills: regex }];
  }
  if (typeof skill === 'string' && skill.trim()) filter.skills = new RegExp(escapeRegex(skill.trim()), 'i');

  // Session 14: count and page in parallel, lean plain objects
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-email -followers -following -__v')
      .sort({ 'rating.average': -1, 'rating.count': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, ...pageMeta(total, page, limit) });
});

// PUT /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  PROFILE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  if (req.body.hourlyRate !== undefined && !req.body.hourlyRate) req.user.hourlyRate = 0;

  await req.user.save();
  res.json({ success: true, user: req.user });
});

// PUT /api/users/me/avatar - Session 8: multer (memory) -> Cloudinary, then remove the old image
const updateAvatar = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Image uploads are not configured. Add the CLOUDINARY_* keys to the server .env');
  }
  if (!req.file) throw new ApiError(400, 'Choose an image to upload');

  const result = await uploadBuffer(req.file.buffer);
  const oldPublicId = req.user.avatar && req.user.avatar.publicId;

  req.user.avatar = { url: result.secure_url, publicId: result.public_id };
  await req.user.save();

  // The new avatar is saved, so a failed cleanup should not fail the request
  if (oldPublicId) await deleteImage(oldPublicId).catch(() => {});

  res.json({ success: true, user: req.user });
});

// GET /api/users/:id - public profile, personalised when logged in (optionalAuth)
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-email -__v').lean();
  const isAdmin = req.user && req.user.role === 'admin';
  if (!user || (user.isBanned && !isAdmin)) throw new ApiError(404, 'User not found');

  const { followers, following, ...publicUser } = user;
  const isFollowing = Boolean(req.user) && followers.some((id) => String(id) === String(req.user._id));

  let stats = {};
  if (user.role === 'client') {
    stats = { gigsPosted: await Gig.countDocuments({ client: user._id }) };
  } else if (user.role === 'freelancer') {
    stats = { gigsCompleted: await Gig.countDocuments({ assignedFreelancer: user._id, status: 'completed' }) };
  }

  res.json({
    success: true,
    user: publicUser,
    counts: { followers: followers.length, following: following.length },
    isFollowing,
    stats,
  });
});

// GET /api/users/:id/reviews - Session 11
const getUserReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { reviewee: req.params.id };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', USER_CARD)
      .populate('gig', 'title')
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, reviews, ...pageMeta(total, page, limit) });
});

// POST /api/users/:id/follow - Session 10: toggle follow / unfollow
const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (String(targetId) === String(req.user._id)) throw new ApiError(400, "You can't follow yourself");

  const target = await User.findById(targetId).select('followers isBanned').lean();
  if (!target || target.isBanned) throw new ApiError(404, 'User not found');

  const wasFollowing = target.followers.some((id) => String(id) === String(req.user._id));
  const op = wasFollowing ? '$pull' : '$addToSet';

  // Update both sides of the relationship in parallel
  const [updated] = await Promise.all([
    User.findByIdAndUpdate(targetId, { [op]: { followers: req.user._id } }, { new: true }).select('followers').lean(),
    User.updateOne({ _id: req.user._id }, { [op]: { following: targetId } }),
  ]);

  if (!wasFollowing) {
    // Session 1: emit an event; the listener creates the notification
    appEvents.emit('notify', {
      user: targetId,
      from: req.user._id,
      type: 'follow',
      message: `${req.user.name} started following you`,
      link: `/users/${req.user._id}`,
    });
  }

  res.json({ success: true, following: !wasFollowing, followersCount: updated.followers.length });
});

module.exports = { listFreelancers, updateMe, updateAvatar, getUserProfile, getUserReviews, followUser };
