const express = require('express');
const {
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
} = require('../controllers/gigController');
const { getGigBids, createBid } = require('../controllers/bidController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { cache } = require('../middlewares/cache');
const { createGigRules, updateGigRules, commentRules, bidRules } = require('../validators');

const router = express.Router();

// Session 14: the public feed is cached for 30 seconds
router.route('/').get(cache(30), listGigs).post(protect, authorize('client'), validate(createGigRules), createGig);

// /mine must come before /:id
router.get('/mine', protect, authorize('client'), myGigs);

router.route('/:id').get(getGig).put(protect, validate(updateGigRules), updateGig).delete(protect, deleteGig);
router.patch('/:id/complete', protect, completeGig);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, validate(commentRules), addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// Bids on a gig live under the gig URL but are handled by the bid controller
router
  .route('/:id/bids')
  .get(protect, getGigBids)
  .post(protect, authorize('freelancer'), validate(bidRules), createBid);

module.exports = router;
