const appEvents = require('./appEvents');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// Session 1 + 12: controllers emit 'notify'; this listener saves the notification
// and pushes it live to the recipient's personal room.
const onNotify = async ({ user, from, type, message, link }) => {
  try {
    if (!user || String(user) === String(from)) return; // never notify yourself

    const notification = await Notification.create({ user, from, type, message, link });
    await notification.populate('from', 'name avatar');

    const io = getIO();
    if (io) io.to(`user:${user}`).emit('notification:new', notification);
  } catch (err) {
    // A failed notification must never crash the server or the request that caused it
    console.error('Could not create notification:', err.message);
  }
};

// Safe to call more than once: the handler is only attached the first time
const registerListeners = () => {
  if (appEvents.listeners('notify').includes(onNotify)) return;
  appEvents.on('notify', onNotify);
};

module.exports = registerListeners;
