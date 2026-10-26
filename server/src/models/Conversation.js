const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: { validator: (arr) => arr.length === 2, message: 'A conversation needs exactly 2 participants' },
    },
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

// One conversation per pair of users. Used by POST /chat/conversations and when a bid is accepted.
// If a gig is given and the conversation is not linked to one yet (or a newer gig), link it.
conversationSchema.statics.findOrCreate = async function (userA, userB, gigId) {
  let conversation = await this.findOne({ participants: { $all: [userA, userB], $size: 2 } });

  if (!conversation) {
    conversation = await this.create({ participants: [userA, userB], gig: gigId || undefined });
  } else if (gigId && String(conversation.gig) !== String(gigId)) {
    conversation.gig = gigId;
    await conversation.save();
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
