const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

// Session 12: one Socket.io server shared by the whole app
let io = null;

// Session 13: online status - userId -> number of open tabs/sockets
const onlineUsers = new Map();

const isOnline = (userId) => onlineUsers.has(String(userId));
const getIO = () => io;

const broadcastOnline = () => io.emit('users:online', [...onlineUsers.keys()]);

// The client sends a conversation id string (an object { conversationId } is accepted too).
// Anything else becomes '' - String() on a crafted object like { toString: 1 } would throw and crash the process.
const readConversationId = (payload) => {
  const id = payload && typeof payload === 'object' ? payload.conversationId : payload;
  return typeof id === 'string' ? id : '';
};

const initSocket = (server, origins) => {
  io = new Server(server, { cors: { origin: origins, credentials: true } });

  // Session 12: authenticate every socket with the same JWT the REST API uses
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      if (!token) return next(new Error('Please log in to continue'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('isBanned').lean();
      if (!user) return next(new Error('Your session has expired. Please log in again'));
      if (user.isBanned) return next(new Error('Your account has been suspended'));

      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error('Your session has expired. Please log in again'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;

    // Personal room: REST controllers and listeners push events to `user:<id>`
    socket.join(`user:${userId}`);
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    broadcastOnline();

    // Session 13: only participants may join a conversation room
    socket.on('conversation:join', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const conversationId = readConversationId(payload);
        if (!mongoose.isValidObjectId(conversationId)) return reply({ ok: false, message: 'Conversation not found' });

        const allowed = await Conversation.exists({ _id: conversationId, participants: userId });
        if (!allowed) return reply({ ok: false, message: 'You are not part of this conversation' });

        socket.join(`conversation:${conversationId}`);
        reply({ ok: true });
      } catch (err) {
        console.error('conversation:join failed:', err.message);
        reply({ ok: false, message: 'Could not open this conversation' });
      }
    });

    socket.on('conversation:leave', (payload) => {
      socket.leave(`conversation:${readConversationId(payload)}`);
    });

    // Typing indicator: relay to everyone else in the room (all of the sender's tabs are excluded)
    const relayTyping = (event) => (payload) => {
      const conversationId = readConversationId(payload);
      const room = `conversation:${conversationId}`;
      if (!socket.rooms.has(room)) return; // must have joined (and passed the participant check)
      socket.to(room).except(`user:${userId}`).emit(event, { conversationId, userId });
    };
    socket.on('typing:start', relayTyping('typing:start'));
    socket.on('typing:stop', relayTyping('typing:stop'));

    socket.on('disconnect', () => {
      const count = (onlineUsers.get(userId) || 1) - 1;
      if (count > 0) onlineUsers.set(userId, count);
      else onlineUsers.delete(userId);
      broadcastOnline();
    });
  });

  return io;
};

module.exports = { initSocket, getIO, isOnline };
