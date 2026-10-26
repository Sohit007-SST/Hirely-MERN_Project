const Review = require('../models/Review');
const Gig = require('../models/Gig');
const appEvents = require('../events/appEvents');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const ALREADY_REVIEWED = 'You have already reviewed this gig';

// POST /api/reviews - Session 11: client and hired freelancer review each other
const createReview = asyncHandler(async (req, res) => {
  const { gigId, rating, comment } = req.body;
  const gig = await Gig.findById(gigId).select('client assignedFreelancer status').lean();
  if (!gig) throw new ApiError(404, 'Gig not found');

  // The reviewee is the other side of the gig
  const me = String(req.user._id);
  let reviewee;
  if (me === String(gig.client)) reviewee = gig.assignedFreelancer;
  else if (gig.assignedFreelancer && me === String(gig.assignedFreelancer)) reviewee = gig.client;
  else throw new ApiError(403, 'Only the client and the hired freelancer can review this gig');

  if (gig.status !== 'completed') throw new ApiError(400, 'You can leave a review once the gig is completed');
  if (await Review.exists({ gig: gig._id, reviewer: req.user._id })) throw new ApiError(400, ALREADY_REVIEWED);

  let review;
  try {
    // post('save') hook recalculates the reviewee's average rating
    review = await Review.create({ gig: gig._id, reviewer: req.user._id, reviewee, rating, comment });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(400, ALREADY_REVIEWED);
    throw err;
  }

  appEvents.emit('notify', {
    user: reviewee,
    from: req.user._id,
    type: 'review',
    message: `${req.user.name} left you a ${rating}-star review`,
    link: `/users/${reviewee}`,
  });

  res.status(201).json({ success: true, review });
});

// GET /api/reviews/gig/:gigId/mine - has the current user reviewed this gig?
const myGigReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ gig: req.params.gigId, reviewer: req.user._id }).lean();
  res.json({ success: true, reviewed: Boolean(review), review: review || null });
});

module.exports = { createReview, myGigReview };
