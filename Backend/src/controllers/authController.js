const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Setting = require('../models/Setting');

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, outletId: user.outletId },
    process.env.JWT_SECRET || 'super_secret_taraaang_jwt_key_2026_production',
    { expiresIn: '30d' }
  );
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
        errorCode: 'MISSING_CREDENTIALS',
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('outletId', 'name code address phone taxPercentage currency isActive');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact your administrator.',
        errorCode: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user);

    // Fetch basic restaurant settings
    const settings = (await Setting.findOne({ key: 'general' })) || {};

    // Don't send password back
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userObj,
        settings: {
          restaurantName: settings.restaurantName || 'Taraaang Organic Food PVT LTD',
          currency: (settings.currency && settings.currency !== '₹') ? settings.currency : 'Rs.',
          logoUrl: settings.logoUrl || '',
          defaultWhatsAppMessage: settings.defaultWhatsAppMessage || '',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile & settings
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('outletId', 'name code address phone taxPercentage currency isActive');

    const settings = (await Setting.findOne({ key: 'general' })) || {};

    res.status(200).json({
      success: true,
      data: {
        user,
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile (name, phone, password)
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
          errorCode: 'CURRENT_PASSWORD_REQUIRED',
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.',
          errorCode: 'PASSWORD_MISMATCH',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
          errorCode: 'PASSWORD_TOO_SHORT',
        });
      }

      user.password = newPassword;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
};
