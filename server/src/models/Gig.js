const mongoose = require('mongoose');

const CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'Design',
  'Writing',
  'Marketing',
  'Data & AI',
  'Video & Audio',
  'Other',
];

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: [true, 'Comment cannot be empty'], trim: true, maxlength: [500, 'Comment must be 500 characters or fewer'] },
  },
  { timestamps: true }
);

const gigSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [100, 'Title must be 100 characters or fewer'] },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description must be 3000 characters or fewer'],
    },
    category: { type: String, required: [true, 'Category is required'], enum: { values: CATEGORIES, message: 'Pick a valid category' } },
    skills: [{ type: String, trim: true }],
    budget: { type: Number, required: [true, 'Budget is required'], min: [100, 'Budget must be at least ₹100'] },
    deadline: { type: Date },
    status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedBid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
    bidsCount: { type: Number, default: 0 },
    // Session 11: likes (saved gigs) and Q&A comments
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Session 14: indexes for search, the filtered feed and "my gigs"
gigSchema.index({ title: 'text', description: 'text', skills: 'text' });
gigSchema.index({ status: 1, category: 1, createdAt: -1 });
gigSchema.index({ client: 1, createdAt: -1 });

const Gig = mongoose.model('Gig', gigSchema);

module.exports = Gig;
module.exports.CATEGORIES = CATEGORIES;
