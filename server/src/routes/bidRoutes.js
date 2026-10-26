const express = require('express');
const { myBids, acceptBid, withdrawBid } = require('../controllers/bidController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/mine', protect, authorize('freelancer'), myBids);
router.patch('/:id/accept', protect, acceptBid);
router.patch('/:id/withdraw', protect, withdrawBid);

module.exports = router;
