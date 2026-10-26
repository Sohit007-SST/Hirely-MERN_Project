const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: [1, 'Rating must be 1 to 5'], max: [5, 'Rating must be 1 to 5'] },
    comment: { type: String, trim: true, maxlength: [1000, 'Review must be 1000 characters or fewer'], default: '' },
  },
  { timestamps: true }
);

// One review per person per gig
reviewSchema.index({ gig: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// Session 11: aggregation pipeline recalculates the reviewee's average rating
reviewSchema.statics.calcAverage = async function (userId) {
  const [result] = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(String(userId)) } },
    { $group: { _id: '$reviewee', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await mongoose.model('User').findByIdAndUpdate(userId, {
    rating: {
      average: result ? Math.round(result.average * 10) / 10 : 0,
      count: result ? result.count : 0,
    },
  });
};

reviewSchema.post('save', async function () {
  await this.constructor.calcAverage(this.reviewee);
});

module.exports = mongoose.model('Review', reviewSchema);
