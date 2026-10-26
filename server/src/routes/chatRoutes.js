const express = require('express');
const { getConversations, startConversation, getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { conversationRules, messageRules } = require('../validators');

// Sessions 12-13: chat REST API (real-time delivery happens over Socket.io)
const router = express.Router();

router.use(protect);

router.route('/conversations').get(getConversations).post(validate(conversationRules), startConversation);
router.route('/conversations/:id/messages').get(getMessages).post(validate(messageRules), sendMessage);

module.exports = router;
