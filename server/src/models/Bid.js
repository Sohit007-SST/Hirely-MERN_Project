const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: [true, 'Bid amount is required'], min: [1, 'Bid amount must be at least ₹1'] },
    deliveryDays: {
      type: Number,
      required: [true, 'Delivery days are required'],
      min: [1, 'Delivery must be at least 1 day'],
      max: [365, 'Delivery must be 365 days or fewer'],
    },
    proposal: {
      type: String,
      required: [true, 'Proposal is required'],
      trim: true,
      minlength: [30, 'Proposal must be at least 30 characters'],
      maxlength: [2000, 'Proposal must be 2000 characters or fewer'],
    },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
  },
  { timestamps: true }
);

// One bid per freelancer per gig
bidSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
