const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');

/**
 * Authentication middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please log in.',
        errorCode: 'AUTH_TOKEN_MISSING',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_taraaang_jwt_key_2026_production'
    );

    const user = await User.findById(decoded.id).populate('outletId', 'name code isActive taxPercentage currency');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or has been disabled.',
        errorCode: 'AUTH_USER_INACTIVE',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
        errorCode: 'AUTH_TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      errorCode: 'AUTH_TOKEN_INVALID',
    });
  }
};

/**
 * Role-Based Access Control middleware
 * @param  {...string} roles Allowed roles (e.g. ROLES.ADMIN, ROLES.MANAGER)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        errorCode: 'UNAUTHENTICATED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
        errorCode: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
};

/**
 * Outlet Isolation middleware
 * Enforces that staff / manager can only access data belonging to their assigned outlet.
 * Admin can access any outlet or pass `outletId` query/body parameter.
 */
const enforceOutletAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
      errorCode: 'UNAUTHENTICATED',
    });
  }

  // Admin has global access to all outlets
  if (req.user.role === ROLES.ADMIN) {
    // If admin explicitly requested a specific outlet, respect that
    req.targetOutletId = req.query.outletId || req.body.outletId || null;
    return next();
  }

  // Non-admins MUST have an assigned active outlet
  if (!req.user.outletId) {
    return res.status(403).json({
      success: false,
      message: 'User is not assigned to an active outlet.',
      errorCode: 'OUTLET_NOT_ASSIGNED',
    });
  }

  // Enforce the user's outlet ID
  req.targetOutletId = req.user.outletId._id || req.user.outletId;

  // If client tried to pass a different outletId in body/query, verify or reject
  const requestedOutlet = req.query.outletId || req.body.outletId;
  if (requestedOutlet && requestedOutlet.toString() !== req.targetOutletId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You cannot view or modify data for another outlet.',
      errorCode: 'OUTLET_ISOLATION_VIOLATION',
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  enforceOutletAccess,
};
