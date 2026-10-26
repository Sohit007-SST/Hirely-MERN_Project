const EventEmitter = require('events');

// Session 1: event-driven architecture - one shared EventEmitter (singleton via require cache).
// Controllers call appEvents.emit('notify', { user, from, type, message, link });
// events/listeners.js reacts by saving + pushing the notification.
class AppEvents extends EventEmitter {}

const appEvents = new AppEvents();

module.exports = appEvents;
