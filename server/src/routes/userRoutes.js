const express = require('express');
const {
  listFreelancers,
  updateMe,
  updateAvatar,
  getUserProfile,
  getUserReviews,
  followUser,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const { updateProfileRules } = require('../validators');

const router = express.Router();

// Fixed paths go before /:id so "freelancers" and "me" are not read as ids
router.get('/freelancers', listFreelancers);
router.put('/me', protect, validate(updateProfileRules), updateMe);
router.put('/me/avatar', protect, upload.single('avatar'), updateAvatar);

router.get('/:id', optionalAuth, getUserProfile);
router.get('/:id/reviews', getUserReviews);
router.post('/:id/follow', protect, followUser);

module.exports = router;
