const express = require('express');
const { createReview, myGigReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { reviewRules } = require('../validators');

const router = express.Router();

router.post('/', protect, validate(reviewRules), createReview);
router.get('/gig/:gigId/mine', protect, myGigReview);

module.exports = router;
