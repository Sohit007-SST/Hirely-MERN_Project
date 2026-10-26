const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'bid',
  'bid-accepted',
  'bid-rejected',
  'comment',
  'like',
  'follow',
  'message',
  'review',
  'gig-completed',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, maxlength: 300 },
    link: { type: String, default: '' }, // a client route such as /gigs/:id
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
