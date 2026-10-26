const express = require('express');
const rateLimit = require('express-rate-limit');
const { writeProposal, improveGigDescription } = require('../controllers/aiController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { proposalAIRules, gigDescriptionAIRules } = require('../validators');

// Session 15: AI calls cost money, so each user gets 20 requests per 15 minutes
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id), // per user, not per IP (runs after protect)
  message: { success: false, message: 'You have used the AI helper 20 times in 15 minutes. Please wait a little and try again' },
});

const router = express.Router();

router.use(protect, aiLimiter);

router.post('/proposal', authorize('freelancer'), validate(proposalAIRules), writeProposal);
router.post('/gig-description', authorize('client'), validate(gigDescriptionAIRules), improveGigDescription);

module.exports = router;
