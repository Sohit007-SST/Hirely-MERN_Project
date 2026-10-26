const User = require('../models/User');
const Gig = require('../models/Gig');
const Bid = require('../models/Bid');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, pageMeta, escapeRegex } = require('../utils/pagination');

// GET /api/admin/stats - Session 6: aggregation pipelines ($group) for platform stats
const getStats = asyncHandler(async (req, res) => {
  const [userGroups, gigGroups, bids, reviews] = await Promise.all([
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 }, banned: { $sum: { $cond: ['$isBanned', 1, 0] } } } },
    ]),
    Gig.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$budget' } } }]),
    Bid.estimatedDocumentCount(),
    Review.estimatedDocumentCount(),
  ]);

  const users = { total: 0, client: 0, freelancer: 0, admin: 0, banned: 0 };
  userGroups.forEach((g) => {
    users[g._id] = g.count;
    users.total += g.count;
    users.banned += g.banned;
  });

  const gigs = { total: 0, open: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
  let completedValue = 0;
  gigGroups.forEach((g) => {
    gigs[g._id] = g.count;
    gigs.total += g.count;
    if (g._id === 'completed') completedValue = g.value;
  });

  res.json({ success: true, stats: { users, gigs, bids, reviews, completedValue } });
});

// GET /api/admin/users?q=&page= - searchable, paginated user table
const listUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit, skip } = getPagination(req.query, 20, 50);

  const filter = {};
  if (q && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role avatar headline rating isBanned createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, ...pageMeta(total, page, limit) });
});

// PATCH /api/admin/users/:id/ban - suspend or restore an account
const toggleBan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, "Admin accounts can't be suspended");

  user.isBanned = !user.isBanned;
  await user.save();

  res.json({ success: true, user });
});

module.exports = { getStats, listUsers, toggleBan };
