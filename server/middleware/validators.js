const { body, validationResult } = require('express-validator');

// Validation rules for auth
const validateAuth = [
    body('email')
        .trim()
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(), // Sanitizes the email (e.g., lowercases it)
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .trim()
        .escape(), // Sanitizes HTML characters to prevent XSS
];

// Middleware to check for errors
const checkValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array();
        return res.status(400).json({
            error: formattedErrors.map((err) => err.msg).join(', '),
            errors: formattedErrors
        });
    }
    next();
};

module.exports = { validateAuth, checkValidationErrors };