const User = require('../models/User');
const { ROLES } = require('../constants/roles');
const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/users
 * @desc    Get paginated staff and managers list
 * @access  Private (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, outletId, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (outletId) {
      query.outletId = outletId;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('outletId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users
 * @desc    Create new staff or manager account
 * @access  Private (Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, outletId, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
        errorCode: 'MISSING_FIELDS',
      });
    }

    // Role check: non-admin roles require an outlet
    if (role !== ROLES.ADMIN && !outletId) {
      return res.status(400).json({
        success: false,
        message: 'Staff and Managers must be assigned to an outlet.',
        errorCode: 'OUTLET_REQUIRED_FOR_STAFF',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        errorCode: 'DUPLICATE_EMAIL',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      outletId: role === ROLES.ADMIN ? null : outletId,
      phone: phone ? phone.trim() : '',
    });

    await user.populate('outletId', 'name code');

    // Audit log
    await AuditLog.create({
      action: 'USER_CREATED',
      performedBy: req.user._id,
      outletId: user.outletId ? user.outletId._id : null,
      details: { userId: user._id, email: user.email, role: user.role },
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} account created successfully`,
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user details, role or outlet assignment
 * @access  Private (Admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, outletId, phone, password, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
          errorCode: 'DUPLICATE_EMAIL',
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (role) user.role = role;
    if (outletId !== undefined) user.outletId = role === ROLES.ADMIN ? null : outletId;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    if (password && password.trim().length >= 6) {
      user.password = password.trim();
    }

    await user.save();
    await user.populate('outletId', 'name code');

    await AuditLog.create({
      action: 'USER_UPDATED',
      performedBy: req.user._id,
      outletId: user.outletId ? user.outletId._id : null,
      details: { userId: user._id, email: user.email, role: user.role },
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle staff active/inactive status
 * @access  Private (Admin only)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
        errorCode: 'CANNOT_DEACTIVATE_SELF',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      performedBy: req.user._id,
      outletId: user.outletId,
      details: { userId: user._id, email: user.email },
    });

    res.status(200).json({
      success: true,
      message: `User is now ${user.isActive ? 'active' : 'inactive'}`,
      data: {
        _id: user._id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
};
