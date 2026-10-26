const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const countUnread = (userId) => Notification.countDocuments({ user: userId, read: false });

// GET /api/notifications - latest 40 + unread count
const getNotifications = asyncHandler(async (req, res) => {
  // Session 14: run both queries in parallel
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(40).populate('from', 'name avatar').lean(),
    countUnread(req.user._id),
  ]);
  res.json({ success: true, notifications, unreadCount });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, unreadCount: 0 });
});

// PATCH /api/notifications/:id/read - owner only
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (String(notification.user) !== String(req.user._id)) throw new ApiError(403, 'This notification belongs to someone else');

  if (!notification.read) {
    notification.read = true;
    await notification.save();
  }
  await notification.populate('from', 'name avatar');

  res.json({ success: true, notification, unreadCount: await countUnread(req.user._id) });
});

module.exports = { getNotifications, markAllRead, markRead };
