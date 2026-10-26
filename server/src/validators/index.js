const { body } = require('express-validator');
const { CATEGORIES } = require('../models/Gig');

// Accept skills as an array or a comma-separated string; always store a clean, de-duplicated array
const toSkills = (value) => {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean))].slice(0, 15);
};

// ---- Auth (Session 7) ----
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['client', 'freelancer']).withMessage('Role must be client or freelancer'),
];

// Standard validators check each item of an array, so reject non-strings first (an array password made bcrypt throw a 500)
const isText = (value) => typeof value === 'string';

const loginRules = [
  body('email').custom(isText).withMessage('Please enter a valid email address').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').custom(isText).withMessage('Password is required').notEmpty().withMessage('Password is required'),
];

// ---- Users ----
const updateProfileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer'),
  body('headline').optional().trim().isLength({ max: 80 }).withMessage('Headline must be 80 characters or fewer'),
  body('bio').optional().trim().isLength({ max: 600 }).withMessage('Bio must be 600 characters or fewer'),
  body('skills').optional().customSanitizer(toSkills),
  body('hourlyRate').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Hourly rate must be 0 or more').toFloat(),
  body('location').optional().trim().isLength({ max: 80 }).withMessage('Location must be 80 characters or fewer'),
];

// ---- Gigs (Session 9) ----
const gigFields = (optional) => {
  const field = (name) => (optional ? body(name).optional() : body(name));
  return [
    field('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer'),
    field('description')
      .trim()
      .isLength({ min: 20 })
      .withMessage('Description must be at least 20 characters')
      .isLength({ max: 3000 })
      .withMessage('Description must be 3000 characters or fewer'),
    field('category').isIn(CATEGORIES).withMessage('Pick a valid category'),
    field('budget').isFloat({ min: 100 }).withMessage('Budget must be at least ₹100').toFloat(),
    body('deadline')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Deadline must be a valid date')
      .custom((value) => new Date(value) > new Date())
      .withMessage('Deadline must be in the future'),
    body('skills').optional().customSanitizer(toSkills),
  ];
};

const createGigRules = gigFields(false);
const updateGigRules = gigFields(true);

// ---- Comments (Session 11) ----
const commentRules = [
  body('text').trim().notEmpty().withMessage('Comment cannot be empty').isLength({ max: 500 }).withMessage('Comment must be 500 characters or fewer'),
];

// ---- Bids ----
const bidRules = [
  body('amount').isFloat({ min: 1 }).withMessage('Bid amount must be at least ₹1').toFloat(),
  body('deliveryDays').isInt({ min: 1, max: 365 }).withMessage('Delivery days must be between 1 and 365').toInt(),
  body('proposal')
    .trim()
    .isLength({ min: 30 })
    .withMessage('Proposal must be at least 30 characters')
    .isLength({ max: 2000 })
    .withMessage('Proposal must be 2000 characters or fewer'),
];

// ---- Reviews (Session 11) ----
const reviewRules = [
  body('gigId').isMongoId().withMessage('A valid gig is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5').toInt(),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Review must be 1000 characters or fewer'),
];

// ---- Chat (Sessions 12-13) ----
const conversationRules = [
  body('userId').isMongoId().withMessage('A valid user is required'),
  body('gigId').optional({ values: 'falsy' }).isMongoId().withMessage('Gig id is not valid'),
];

const messageRules = [
  body('text').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 2000 }).withMessage('Message must be 2000 characters or fewer'),
];

// ---- AI (Session 15) ----
const proposalAIRules = [
  body('gigId').isMongoId().withMessage('A valid gig is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be 500 characters or fewer'),
];

const gigDescriptionAIRules = [
  body('title').trim().notEmpty().withMessage('Add a title first').isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Write at least 10 characters of notes first')
    .isLength({ max: 3000 })
    .withMessage('Notes must be 3000 characters or fewer'),
  body('category').optional({ values: 'falsy' }).isIn(CATEGORIES).withMessage('Pick a valid category'),
];

module.exports = {
  toSkills,
  registerRules,
  loginRules,
  updateProfileRules,
  createGigRules,
  updateGigRules,
  commentRules,
  bidRules,
  reviewRules,
  conversationRules,
  messageRules,
  proposalAIRules,
  gigDescriptionAIRules,
};
