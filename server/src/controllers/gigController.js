const Gig = require('../models/Gig');
const Bid = require('../models/Bid');
const appEvents = require('../events/appEvents');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { clearCache } = require('../middlewares/cache');
const { getPagination, pageMeta, escapeRegex } = require('../utils/pagination');

const { CATEGORIES } = Gig;
const STATUSES = ['open', 'in-progress', 'completed', 'cancelled'];
const USER_CARD = 'name avatar headline role rating';
const COMMENT_USER = 'name avatar role';
const EDITABLE_FIELDS = ['title', 'description', 'category', 'budget', 'skills'];

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'budget-high': { budget: -1, createdAt: -1 },
  'budget-low': { budget: 1, createdAt: -1 },
  popular: { bidsCount: -1, createdAt: -1 },
};

const isSameId = (a, b) => String(a) === String(b);

const findGigOr404 = async (id, fields) => {
  const gig = await Gig.findById(id).select(fields);
  if (!gig) throw new ApiError(404, 'Gig not found');
  return gig;
};

// GET /api/gigs - Session 9: search, filters, sort and pagination (cached 30 s)
const listGigs = asyncHandler(async (req, res) => {
  const { q, category, status = 'open', minBudget, maxBudget, skill, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query, 12, 50);

  const filter = {};
  if (status !== 'all') filter.status = STATUSES.includes(status) ? status : 'open';
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (typeof skill === 'string' && skill.trim()) filter.skills = new RegExp(`^${escapeRegex(skill.trim())}$`, 'i');

  const min = Number(minBudget);
  const max = Number(maxBudget);
  if (minBudget && Number.isFinite(min)) filter.budget = { ...filter.budget, $gte: min };
  if (maxBudget && Number.isFinite(max)) filter.budget = { ...filter.budget, $lte: max };

  // Session 14: the text index on title, description and skills powers search
  if (typeof q === 'string' && q.trim()) filter.$text = { $search: q.trim() };

  const [gigs, total] = await Promise.all([
    Gig.find(filter)
      .select('-comments')
      .sort(SORTS[sort] || SORTS.newest)
      .skip(skip)
      .limit(limit)
      .populate('client', 'name avatar rating')
      .lean(),
    Gig.countDocuments(filter),
  ]);

  res.json({ success: true, gigs, ...pageMeta(total, page, limit) });
});

// POST /api/gigs - Session 3: create
const createGig = asyncHandler(async (req, res) => {
  const { title, description, category, budget, deadline, skills } = req.body;

  const gig = await Gig.create({
    client: req.user._id,
    title,
    description,
    category,
    budget,
    deadline: deadline || undefined,
    skills: skills || [],
  });

  clearCache('/api/gigs');
  res.status(201).json({ success: true, gig });
});

// GET /api/gigs/mine - the client's own gigs for the dashboard
const myGigs = asyncHandler(async (req, res) => {
  const gigs = await Gig.find({ client: req.user._id })
    .select('-comments')
    .sort({ createdAt: -1 })
    .populate('assignedFreelancer', 'name avatar')
    .lean();

  res.json({ success: true, gigs });
});

// GET /api/gigs/:id - Session 3: read one
const getGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
    .populate('client', `${USER_CARD} location createdAt`)
    .populate('assignedFreelancer', USER_CARD)
    .populate('comments.user', COMMENT_USER)
    .lean();
  if (!gig) throw new ApiError(404, 'Gig not found');

  res.json({ success: true, gig });
});

// PUT /api/gigs/:id - Session 3: update (owner only, while open)
const updateGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) throw new ApiError(404, 'Gig not found');
  if (!isSameId(gig.client, req.user._id)) throw new ApiError(403, 'Only the client who posted this gig can edit it');
  if (gig.status !== 'open') throw new ApiError(400, 'Only open gigs can be edited');

  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) gig[field] = req.body[field];
  });
  if (req.body.deadline !== undefined) gig.deadline = req.body.deadline || undefined;

  await gig.save();
  clearCache('/api/gigs');
  res.json({ success: true, gig });
});

// DELETE /api/gigs/:id - Session 3: delete (owner or admin) and its bids
const deleteGig = asyncHandler(async (req, res) => {
  const gig = await findGigOr404(req.params.id, 'client status');
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !isSameId(gig.client, req.user._id)) {
    throw new ApiError(403, 'Only the client who posted this gig can delete it');
  }
  if (!isAdmin && gig.status === 'in-progress') {
    throw new ApiError(400, "A gig that is in progress can't be deleted");
  }

  await Promise.all([Bid.deleteMany({ gig: gig._id }), gig.deleteOne()]);

  clearCache('/api/gigs');
  res.json({ success: true, message: 'Gig deleted' });
});

// PATCH /api/gigs/:id/complete - owner marks an in-progress gig as completed
const completeGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) throw new ApiError(404, 'Gig not found');
  if (!isSameId(gig.client, req.user._id)) {
    throw new ApiError(403, 'Only the client who posted this gig can mark it complete');
  }
  if (gig.status !== 'in-progress') throw new ApiError(400, 'Only gigs in progress can be marked complete');

  gig.status = 'completed';
  await gig.save();

  appEvents.emit('notify', {
    user: gig.assignedFreelancer,
    from: req.user._id,
    type: 'gig-completed',
    message: `"${gig.title}" was marked complete. Leave a review`,
    link: `/gigs/${gig._id}`,
  });

  clearCache('/api/gigs');
  res.json({ success: true, gig });
});

// POST /api/gigs/:id/like - Session 11: toggle save
const toggleLike = asyncHandler(async (req, res) => {
  const gig = await findGigOr404(req.params.id, 'client title');
  const alreadyLiked = await Gig.exists({ _id: gig._id, likes: req.user._id });

  const update = alreadyLiked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } };
  const updated = await Gig.findByIdAndUpdate(gig._id, update, { new: true }).select('likes').lean();

  if (!alreadyLiked) {
    appEvents.emit('notify', {
      user: gig.client,
      from: req.user._id,
      type: 'like',
      message: `${req.user.name} saved your gig "${gig.title}"`,
      link: `/gigs/${gig._id}`,
    });
  }

  clearCache('/api/gigs');
  res.json({ success: true, liked: !alreadyLiked, likesCount: updated.likes.length });
});

// POST /api/gigs/:id/comments - Session 11: public Q&A
const addComment = asyncHandler(async (req, res) => {
  const gig = await findGigOr404(req.params.id, 'client title');

  const updated = await Gig.findByIdAndUpdate(
    gig._id,
    { $push: { comments: { user: req.user._id, text: req.body.text } } },
    { new: true, runValidators: true }
  )
    .select('comments')
    .populate('comments.user', COMMENT_USER)
    .lean();

  appEvents.emit('notify', {
    user: gig.client,
    from: req.user._id,
    type: 'comment',
    message: `${req.user.name} asked a question on "${gig.title}"`,
    link: `/gigs/${gig._id}`,
  });

  clearCache('/api/gigs');
  res.status(201).json({ success: true, comments: updated.comments });
});

// DELETE /api/gigs/:id/comments/:commentId - comment author, gig owner or admin
const deleteComment = asyncHandler(async (req, res) => {
  const gig = await findGigOr404(req.params.id, 'client comments');
  const comment = gig.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const canDelete =
    req.user.role === 'admin' || isSameId(comment.user, req.user._id) || isSameId(gig.client, req.user._id);
  if (!canDelete) throw new ApiError(403, 'You can only delete your own comments');

  const updated = await Gig.findByIdAndUpdate(
    gig._id,
    { $pull: { comments: { _id: comment._id } } },
    { new: true }
  )
    .select('comments')
    .populate('comments.user', COMMENT_USER)
    .lean();

  clearCache('/api/gigs');
  res.json({ success: true, comments: updated.comments });
});

module.exports = {
  listGigs,
  createGig,
  myGigs,
  getGig,
  updateGig,
  deleteGig,
  completeGig,
  toggleLike,
  addComment,
  deleteComment,
};
