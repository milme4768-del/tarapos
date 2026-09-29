/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id of ${err.value}`,
      errorCode: 'INVALID_RESOURCE_ID',
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      errorCode: 'DUPLICATE_KEY_ERROR',
      field,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errorCode: 'VALIDATION_ERROR',
      errors: messages,
    });
  }

  // Fallback internal server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errorCode: error.errorCode || 'INTERNAL_SERVER_ERROR',
  });
};

module.exports = errorHandler;
