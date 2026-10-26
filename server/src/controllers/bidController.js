const Bid = require('../models/Bid');
const Gig = require('../models/Gig');
const Conversation = require('../models/Conversation');
const appEvents = require('../events/appEvents');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { clearCache } = require('../middlewares/cache');

const FREELANCER_FIELDS = 'name avatar headline rating skills hourlyRate';
const ALREADY_BID = 'You have already bid on this gig';

const formatINR = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

// GET /api/gigs/:id/bids - owner/admin see every bid, anyone else only their own
const getGigBids = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id).select('client').lean();
  if (!gig) throw new ApiError(404, 'Gig not found');

  const canSeeAll = req.user.role === 'admin' || String(gig.client) === String(req.user._id);
  const filter = canSeeAll ? { gig: gig._id } : { gig: gig._id, freelancer: req.user._id };

  const bids = await Bid.find(filter).sort({ createdAt: -1 }).populate('freelancer', FREELANCER_FIELDS).lean();
  res.json({ success: true, bids });
});

// POST /api/gigs/:id/bids - freelancer places a bid (or re-activates a withdrawn one)
const createBid = asyncHandler(async (req, res) => {
  const { amount, deliveryDays, proposal } = req.body;
  const gig = await Gig.findById(req.params.id).select('client status title').lean();
  if (!gig) throw new ApiError(404, 'Gig not found');
  if (String(gig.client) === String(req.user._id)) throw new ApiError(400, "You can't bid on your own gig");
  if (gig.status !== 'open') throw new ApiError(400, 'This gig is no longer accepting bids');

  const existing = await Bid.findOne({ gig: gig._id, freelancer: req.user._id }).select('status').lean();
  if (existing && existing.status !== 'withdrawn') throw new ApiError(400, ALREADY_BID);

  let bid;
  if (existing) {
    // Re-activate atomically so two quick clicks can't both succeed
    bid = await Bid.findOneAndUpdate(
      { _id: existing._id, status: 'withdrawn' },
      { amount, deliveryDays, proposal, status: 'pending' },
      { new: true, runValidators: true }
    );
    if (!bid) throw new ApiError(400, ALREADY_BID);
  } else {
    try {
      bid = await Bid.create({ gig: gig._id, freelancer: req.user._id, amount, deliveryDays, proposal });
    } catch (err) {
      if (err.code === 11000) throw new ApiError(400, ALREADY_BID); // unique { gig, freelancer } index
      throw err;
    }
  }

  await Gig.updateOne({ _id: gig._id }, { $inc: { bidsCount: 1 } });
  await bid.populate('freelancer', FREELANCER_FIELDS);

  // Session 1: event-driven notification for the gig owner
  appEvents.emit('notify', {
    user: gig.client,
    from: req.user._id,
    type: 'bid',
    message: `${req.user.name} bid ${formatINR(amount)} on "${gig.title}"`,
    link: `/gigs/${gig._id}`,
  });

  clearCache('/api/gigs');
  res.status(201).json({ success: true, bid });
});

// GET /api/bids/mine - the freelancer's bids for the dashboard
const myBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ freelancer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('gig', 'title budget status category client assignedFreelancer')
    .lean();

  res.json({ success: true, bids });
});

// PATCH /api/bids/:id/accept - the gig owner hires a freelancer
const acceptBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).lean();
  if (!bid) throw new ApiError(404, 'Bid not found');

  const gig = await Gig.findById(bid.gig).select('client status title').lean();
  if (!gig) throw new ApiError(404, 'Gig not found');
  if (String(gig.client) !== String(req.user._id)) throw new ApiError(403, 'Only the client who posted this gig can accept bids');
  if (gig.status !== 'open') throw new ApiError(400, 'This gig already has a freelancer');
  if (bid.status !== 'pending') throw new ApiError(400, 'Only pending bids can be accepted');

  // Race-safe: claim the gig first. Only one request can move it from "open" to "in-progress".
  const updatedGig = await Gig.findOneAndUpdate(
    { _id: gig._id, status: 'open' },
    { status: 'in-progress', assignedFreelancer: bid.freelancer, acceptedBid: bid._id },
    { new: true }
  )
    .select('-comments')
    .lean();
  if (!updatedGig) throw new ApiError(400, 'This gig already has a freelancer');

  const accepted = await Bid.findOneAndUpdate(
    { _id: bid._id, status: 'pending' },
    { status: 'accepted' },
    { new: true }
  ).populate('freelancer', FREELANCER_FIELDS);
  if (!accepted) {
    // The bid was withdrawn a moment ago: re-open the gig
    await Gig.updateOne({ _id: gig._id }, { status: 'open', $unset: { assignedFreelancer: 1, acceptedBid: 1 } });
    throw new ApiError(400, 'This bid is no longer pending');
  }

  // Every other pending bid is rejected automatically
  const rejected = await Bid.find({ gig: gig._id, status: 'pending' }).select('freelancer').lean();
  const [conversation] = await Promise.all([
    Conversation.findOrCreate(gig.client, bid.freelancer, gig._id),
    Bid.updateMany({ gig: gig._id, status: 'pending' }, { status: 'rejected' }),
  ]);

  appEvents.emit('notify', {
    user: bid.freelancer,
    from: req.user._id,
    type: 'bid-accepted',
    message: `Your bid on "${gig.title}" was accepted. Say hello!`,
    link: `/chat/${conversation._id}`,
  });
  rejected.forEach((b) =>
    appEvents.emit('notify', {
      user: b.freelancer,
      from: req.user._id,
      type: 'bid-rejected',
      message: `Another freelancer was hired for "${gig.title}"`,
      link: `/gigs/${gig._id}`,
    })
  );

  clearCache('/api/gigs');
  res.json({ success: true, bid: accepted, gig: updatedGig, conversationId: conversation._id });
});

// PATCH /api/bids/:id/withdraw - only the bid owner, only while pending
const withdrawBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).select('freelancer status').lean();
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.freelancer) !== String(req.user._id)) throw new ApiError(403, 'You can only withdraw your own bid');
  if (bid.status !== 'pending') throw new ApiError(400, 'Only pending bids can be withdrawn');

  const withdrawn = await Bid.findOneAndUpdate(
    { _id: bid._id, status: 'pending' },
    { status: 'withdrawn' },
    { new: true }
  );
  if (!withdrawn) throw new ApiError(400, 'Only pending bids can be withdrawn');

  await Gig.updateOne({ _id: withdrawn.gig, bidsCount: { $gt: 0 } }, { $inc: { bidsCount: -1 } });

  clearCache('/api/gigs');
  res.json({ success: true, bid: withdrawn });
});

module.exports = { getGigBids, createBid, myBids, acceptBid, withdrawBid };
