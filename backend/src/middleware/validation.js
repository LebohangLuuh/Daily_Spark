import { body, validationResult } from 'express-validator';

export const validateContent = [
  body('text')
    .isLength({ min: 3, max: 2000 })
    .withMessage('Content must be between 3 and 2000 characters')
    .trim()
    .escape(),
  body('type')
    .isIn(['joke', 'fact', 'idea', 'quote'])
    .withMessage('Invalid content type'),
  body('author')
    .isLength({ min: 1, max: 100 })
    .withMessage('Author name must be between 1 and 100 characters')
    .trim()
    .escape(),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
