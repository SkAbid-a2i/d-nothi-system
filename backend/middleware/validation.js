// middleware/validation.js
const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidation = [
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const taskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('assigned_to').isInt().withMessage('Valid assigned user is required'),
  body('due_date').isDate().withMessage('Valid due date is required'),
  handleValidationErrors
];

const leaveValidation = [
  body('leave_type_id').isInt().withMessage('Valid leave type is required'),
  body('start_date').isDate().withMessage('Valid start date is required'),
  body('end_date').isDate().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  taskValidation,
  leaveValidation,
  handleValidationErrors
};