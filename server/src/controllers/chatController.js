const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const appEvents = require('../events/appEvents');
const { getIO, isOnline } = require('../socket');

const USER_CARD = 'name avatar headline role rating';
const PAGE_SIZE = 30;

// Session 13: unread counts for many conversations with ONE aggregation
// (messages sent by the other person that I haven't read yet, grouped by conversation)
const withUnreadCounts = async (conversations, userId) => {
  const me = new mongoose.Types.ObjectId(String(userId));
  const counts = await Message.aggregate([
    { $match: { conversation: { $in: conversations.map((c) => c._id) }, sender: { $ne: me }, readBy: { $ne: me } } },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ]);
  const unreadById = new Map(counts.map((c) => [String(c._id), c.count]));

  return conversations.map((c) => ({
    _id: c._id,
    participants: c.participants,
    gig: c.gig || null,
    lastMessage: c.lastMessage,
    updatedAt: c.updatedAt,
    unreadCount: unreadById.get(String(c._id)) || 0,
  }));
};

const findConversations = (filter) =>
  Conversation.find(filter)
    .sort({ updatedAt: -1 })
    .populate('participants', USER_CARD)
    .populate('gig', 'title')
    .lean();

// Only the two participants may read or write a conversation
const loadConversation = async (id, userId) => {
  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  if (!conversation.participants.some((p) => String(p) === String(userId))) {
    throw new ApiError(403, 'You are not part of this conversation');
  }
  return conversation;
};

// GET /api/chat/conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await findConversations({ participants: req.user._id });
  res.json({ success: true, conversations: await withUnreadCounts(conversations, req.user._id) });
});

// POST /api/chat/conversations { userId, gigId? } - find or create the chat between two users
const startConversation = asyncHandler(async (req, res) => {
  const { userId, gigId } = req.body;
  if (String(userId) === String(req.user._id)) throw new ApiError(400, 'You cannot start a conversation with yourself');

  const [other, gig] = await Promise.all([
    User.findOne({ _id: userId, isBanned: false }).select('_id').lean(),
    gigId ? Gig.exists({ _id: gigId }) : true,
  ]);
  if (!other) throw new ApiError(404, 'User not found');
  if (!gig) throw new ApiError(404, 'Gig not found');

  const { _id } = await Conversation.findOrCreate(req.user._id, userId, gigId);
  const [conversation] = await withUnreadCounts(await findConversations({ _id }), req.user._id);
  res.json({ success: true, conversation });
});

// GET /api/chat/conversations/:id/messages?before= - 30 per page, oldest first
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user._id);
  const filter = { conversation: conversation._id };

  // "Load older messages": `before` is a message id or an ISO date
  const { before } = req.query;
  if (before) {
    let beforeDate;
    if (mongoose.isValidObjectId(before)) {
      const cursor = await Message.findOne({ _id: before, conversation: conversation._id }).select('createdAt').lean();
      if (!cursor) throw new ApiError(404, 'Message not found');
      beforeDate = cursor.createdAt;
    } else {
      beforeDate = new Date(before);
      if (Number.isNaN(beforeDate.getTime())) throw new ApiError(400, '"before" must be a message id or a date');
    }
    filter.createdAt = { $lt: beforeDate };
  }

  // Opening the thread marks the other person's messages as read
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  // Fetch one extra newest-first to know if older messages exist, then flip to oldest-first
  const page = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE + 1)
    .populate('sender', 'name avatar')
    .lean();
  const hasMore = page.length > PAGE_SIZE;
  const messages = page.slice(0, PAGE_SIZE).reverse();

  res.json({ success: true, messages, hasMore });
});

// POST /api/chat/conversations/:id/messages { text } - save first, then emit
const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user._id);
  const me = req.user;

  const message = await Message.create({
    conversation: conversation._id,
    sender: me._id,
    text: req.body.text,
    readBy: [me._id],
  });

  // Updating lastMessage also bumps updatedAt, so the chat list re-sorts
  conversation.lastMessage = { text: message.text, sender: me._id, createdAt: message.createdAt };
  await conversation.save();

  const chatMessage = {
    _id: message._id,
    conversation: String(conversation._id),
    sender: { _id: me._id, name: me.name, avatar: me.avatar },
    text: message.text,
    readBy: message.readBy,
    createdAt: message.createdAt,
  };

  // Session 12: push to every participant's personal room (the sender's other tabs too)
  const io = getIO();
  if (io) io.to(conversation.participants.map((p) => `user:${p}`)).emit('message:new', chatMessage);

  // Session 1: only notify the recipient when they are offline (online users see the message live)
  const recipient = conversation.participants.find((p) => String(p) !== String(me._id));
  if (recipient && !isOnline(recipient)) {
    appEvents.emit('notify', {
      user: recipient,
      from: me._id,
      type: 'message',
      message: `New message from ${me.name}`,
      link: `/chat/${conversation._id}`,
    });
  }

  res.status(201).json({ success: true, chatMessage });
});

module.exports = { getConversations, startConversation, getMessages, sendMessage };
