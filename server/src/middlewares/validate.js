const { validationResult } = require('express-validator');

// Session 8: runs express-validator rule arrays and returns the first error as a 400
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({ success: false, message: errors[0].message, errors });
  },
];

module.exports = validate;
