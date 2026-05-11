const { body, validationResult } = require('express-validator');

module.exports = [
  body('url')
    .exists().withMessage('URL is required')
    .isURL().withMessage('Invalid URL format')
    .trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
