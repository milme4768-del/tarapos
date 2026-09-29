const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const { normalizeMobile } = require('../utils/phone');

/**
 * @route   GET /api/customers
 * @desc    Get paginated customers with search
 * @access  Private
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'lastVisitAt', order = 'desc' } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { mobile: searchRegex },
        { normalizedMobile: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const [customers, total] = await Promise.all([
      Customer.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Customer.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
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
 * @route   GET /api/customers/lookup
 * @desc    Quick lookup customer by phone number (for billing screen autofill)
 * @access  Private
 */
const lookupCustomer = async (req, res, next) => {
  try {
    const { mobile } = req.query;
    if (!mobile || mobile.trim().length < 4) {
      return res.status(200).json({ success: true, data: null });
    }

    const normalized = normalizeMobile(mobile);
    const customer = await Customer.findOne({
      $or: [{ normalizedMobile: normalized }, { mobile: mobile.trim() }],
    }).lean();

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer details and recent billing history
 * @access  Private
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        errorCode: 'CUSTOMER_NOT_FOUND',
      });
    }

    // Fetch recent bills for this customer (up to 20)
    const recentBills = await Bill.find({ customerId: customer._id })
      .populate('outletId', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        customer,
        recentBills,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  lookupCustomer,
  getCustomerById,
};
