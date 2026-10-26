const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Session 6: model with validation, refs and indexes
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [50, 'Name must be 50 characters or fewer'] },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'freelancer' },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    headline: { type: String, trim: true, maxlength: [80, 'Headline must be 80 characters or fewer'], default: '' },
    bio: { type: String, trim: true, maxlength: [600, 'Bio must be 600 characters or fewer'], default: '' },
    skills: [{ type: String, trim: true }],
    hourlyRate: { type: Number, min: [0, 'Hourly rate cannot be negative'], default: 0 },
    location: { type: String, trim: true, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isBanned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, isBanned: 1 });

// Session 7: hash the password before saving (Mongoose 8 async hook - no `next`)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
