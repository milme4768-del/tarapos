const Outlet = require('../models/Outlet');
const { ROLES } = require('../constants/roles');

/**
 * @route   GET /api/outlets
 * @desc    Get all outlets (Admin sees all; Manager/Staff sees their assigned outlet)
 * @access  Private
 */
const getOutlets = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role !== ROLES.ADMIN) {
      // Staff/Manager only sees their assigned active outlet
      query = { _id: req.user.outletId, isActive: true };
    } else if (req.query.activeOnly === 'true') {
      query.isActive = true;
    }

    const outlets = await Outlet.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: outlets.length,
      data: outlets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/outlets/:id
 * @desc    Get single outlet
 * @access  Private
 */
const getOutletById = async (req, res, next) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
        errorCode: 'OUTLET_NOT_FOUND',
      });
    }

    // Verify outlet access
    if (
      req.user.role !== ROLES.ADMIN &&
      req.user.outletId.toString() !== outlet._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this outlet',
        errorCode: 'OUTLET_ACCESS_DENIED',
      });
    }

    res.status(200).json({
      success: true,
      data: outlet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/outlets
 * @desc    Create new outlet
 * @access  Private (Admin only)
 */
const createOutlet = async (req, res, next) => {
  try {
    const { name, code, address, phone, email, taxPercentage, currency } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Outlet name and code are required.',
        errorCode: 'MISSING_FIELDS',
      });
    }

    const existingCode = await Outlet.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: `Outlet code '${code.toUpperCase()}' is already in use.`,
        errorCode: 'DUPLICATE_OUTLET_CODE',
      });
    }

    const outlet = await Outlet.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      address: address ? address.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      taxPercentage: taxPercentage !== undefined ? Number(taxPercentage) : 5,
      currency: currency || '₹',
    });

    res.status(201).json({
      success: true,
      message: 'Outlet created successfully',
      data: outlet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/outlets/:id
 * @desc    Update outlet details
 * @access  Private (Admin only)
 */
const updateOutlet = async (req, res, next) => {
  try {
    const { name, code, address, phone, email, taxPercentage, currency, isActive } = req.body;

    const outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
        errorCode: 'OUTLET_NOT_FOUND',
      });
    }

    if (code && code.toUpperCase().trim() !== outlet.code) {
      const existing = await Outlet.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Outlet code '${code.toUpperCase()}' is already in use.`,
          errorCode: 'DUPLICATE_OUTLET_CODE',
        });
      }
      outlet.code = code.toUpperCase().trim();
    }

    if (name) outlet.name = name.trim();
    if (address !== undefined) outlet.address = address.trim();
    if (phone !== undefined) outlet.phone = phone.trim();
    if (email !== undefined) outlet.email = email.trim();
    if (taxPercentage !== undefined) outlet.taxPercentage = Number(taxPercentage);
    if (currency !== undefined) outlet.currency = currency;
    if (isActive !== undefined) outlet.isActive = Boolean(isActive);

    await outlet.save();

    res.status(200).json({
      success: true,
      message: 'Outlet updated successfully',
      data: outlet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/outlets/:id/status
 * @desc    Toggle outlet active/inactive status
 * @access  Private (Admin only)
 */
const toggleOutletStatus = async (req, res, next) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
        errorCode: 'OUTLET_NOT_FOUND',
      });
    }

    outlet.isActive = !outlet.isActive;
    await outlet.save();

    res.status(200).json({
      success: true,
      message: `Outlet is now ${outlet.isActive ? 'active' : 'inactive'}`,
      data: outlet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/outlets/public
 * @desc    Public listing of active outlets for display on Login and receipts
 * @access  Public
 */
const getPublicOutlets = async (req, res, next) => {
  try {
    const outlets = await Outlet.find({ isActive: true }).select('name code address phone');
    res.status(200).json({
      success: true,
      count: outlets.length,
      data: outlets,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOutlets,
  getOutletById,
  createOutlet,
  updateOutlet,
  toggleOutletStatus,
  getPublicOutlets,
};
