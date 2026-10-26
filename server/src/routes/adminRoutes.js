const express = require('express');
const { getStats, listUsers, toggleBan } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Session 7: every admin route needs a logged-in admin
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id/ban', toggleBan);

module.exports = router;
