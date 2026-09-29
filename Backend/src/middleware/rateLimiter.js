const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
