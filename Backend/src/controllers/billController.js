const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Outlet = require('../models/Outlet');
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');
const { ROLES, BILL_STATUS } = require('../constants/roles');
const {
  toPaise,
  toRupees,
  calculateLineTotalPaise,
  calculateTaxPaise,
} = require('../utils/money');
const { normalizeMobile, generateWhatsAppLink } = require('../utils/phone');

/**
 * @route   POST /api/bills
 * @desc    Create new bill with full server-side price validation & customer deduplication
 * @access  Private (Staff, Manager, Admin)
 */
const createBill = async (req, res, next) => {
  try {
    const {
      clientRequestId,
      customer = {},
      items = [],
      discount = 0,
      discountType = 'flat',
      discountValue = 0,
      paymentMethod = 'cash',
      notes = '',
    } = req.body;

    // 1. Mandatory Customer Name and Mobile Validation
    const rawMobile = customer?.mobile ? String(customer.mobile).trim() : '';
    const rawName = customer?.name ? String(customer.name).trim() : '';

    if (!rawMobile || rawMobile.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Customer mobile number is mandatory (minimum 10 digits required).',
        errorCode: 'CUSTOMER_MOBILE_REQUIRED',
      });
    }

    if (!rawName) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is mandatory.',
        errorCode: 'CUSTOMER_NAME_REQUIRED',
      });
    }

    // 2. Idempotency Check: prevent duplicate billing on network glitch or double-tap
    if (clientRequestId) {
      const existingBill = await Bill.findOne({ clientRequestId })
        .populate('outletId', 'name code address phone taxPercentage currency')
        .populate('createdBy', 'name email');

      if (existingBill) {
        return res.status(200).json({
          success: true,
          message: 'Bill was already generated (idempotent response).',
          data: existingBill,
        });
      }
    }

    // 3. Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A bill must have at least one food item.',
        errorCode: 'EMPTY_CART',
      });
    }

    // 3. Determine Outlet
    let outletId = undefined;
    if (req.body.outletId !== undefined) {
      if (req.body.outletId === 'none' || req.body.outletId === '' || req.body.outletId === null) {
        outletId = null;
      } else {
        outletId = req.body.outletId;
      }
    } else {
      outletId = req.user.outletId ? (req.user.outletId._id || req.user.outletId) : null;
    }

    let outlet = null;
    if (outletId) {
      // Non-admin can only bill for outlets they are assigned to
      if (req.user.role !== ROLES.ADMIN) {
        const allowedIds = (req.user.outlets && req.user.outlets.length > 0)
          ? req.user.outlets.map((o) => (o._id || o).toString())
          : (req.user.outletId ? [(req.user.outletId._id || req.user.outletId).toString()] : []);
        if (!allowedIds.includes(outletId.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not assigned to this outlet.',
            errorCode: 'OUTLET_ACCESS_DENIED',
          });
        }
      }

      outlet = await Outlet.findById(outletId);
      if (!outlet || !outlet.isActive) {
        return res.status(400).json({
          success: false,
          message: 'The designated outlet is inactive or not found.',
          errorCode: 'OUTLET_INACTIVE',
        });
      }
    }

    // 4. Fetch Products & Variants to verify prices and build immutable snapshots
    const validatedItems = [];
    let subtotalPaise = 0;

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer.',
          errorCode: 'INVALID_QUANTITY',
        });
      }

      // 4a. Manual / Custom off-menu item
      if (item.isCustom || !item.productId) {
        const customName = (item.productName || item.name || '').trim();
        if (!customName) {
          return res.status(400).json({
            success: false,
            message: 'Manual food item must have a name.',
            errorCode: 'INVALID_CUSTOM_ITEM_NAME',
          });
        }
        const unitPriceRupees = Math.max(0, Number(item.unitPrice !== undefined ? item.unitPrice : item.price) || 0);
        const lineTotalPaise = calculateLineTotalPaise(unitPriceRupees, qty);
        subtotalPaise += lineTotalPaise;

        validatedItems.push({
          productId: null,
          variantId: null,
          productName: customName,
          variantName: (item.variantName || 'Special / Manual').trim(),
          quantity: qty,
          unit: item.unit || 'unit',
          unitPrice: unitPriceRupees,
          lineTotal: toRupees(lineTotalPaise),
          isCustom: true,
        });
        continue;
      }

      // 4b. Catalog item verification
      if (!item.variantId) {
        return res.status(400).json({
          success: false,
          message: 'Catalog item must have a valid variantId.',
          errorCode: 'INVALID_ITEM_SPEC',
        });
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Food item "${product ? product.name : 'Unknown'}" is currently unavailable.`,
          errorCode: 'PRODUCT_UNAVAILABLE',
        });
      }

      const variant = product.variants.id(item.variantId);
      if (!variant || variant.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `Variant "${variant ? variant.name : 'Unknown'}" for ${product.name} is unavailable.`,
          errorCode: 'VARIANT_UNAVAILABLE',
        });
      }

      // Server-side verified price
      const unitPriceRupees = variant.price;
      const lineTotalPaise = calculateLineTotalPaise(unitPriceRupees, qty);
      subtotalPaise += lineTotalPaise;

      validatedItems.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantName: variant.name,
        quantity: qty,
        unit: variant.unit || 'plate',
        unitPrice: unitPriceRupees,
        lineTotal: toRupees(lineTotalPaise),
        isCustom: false,
      });
    }

    // 5. Calculate Discount & Tax
    const settings = (await Setting.findOne({ key: 'general' })) || {};
    const restaurantName = settings.restaurantName || 'Taraaang Organic Food PVT LTD';

    let discountPaise = 0;
    const dType = discountType === 'percentage' ? 'percentage' : 'flat';
    const dVal = Number(discountValue !== undefined && discountValue !== '' ? discountValue : discount) || 0;

    if (dType === 'percentage') {
      const pct = Math.max(0, Math.min(100, dVal));
      discountPaise = Math.round((subtotalPaise * pct) / 100);
    } else {
      discountPaise = Math.min(toPaise(dVal), subtotalPaise);
    }

    const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
    const taxPercentage = outlet ? (Number(outlet.taxPercentage) || 0) : (Number(settings.defaultTaxPercentage) || 0);
    const taxPaise = calculateTaxPaise(taxablePaise, taxPercentage);
    const grandTotalPaise = taxablePaise + taxPaise;

    const subtotalRupees = toRupees(subtotalPaise);
    const discountRupees = toRupees(discountPaise);
    const taxRupees = toRupees(taxPaise);
    const grandTotalRupees = toRupees(grandTotalPaise);

    // 6. Generate Atomic Bill Number
    const currentYear = new Date().getFullYear();
    const outletCode = outlet ? outlet.code : 'TOF';
    const counterKey = `bill_${outletCode}_${currentYear}`;
    const nextSeq = await Counter.getNextSequence(counterKey);
    const billNumber = `${outletCode}-${currentYear}-${String(nextSeq).padStart(6, '0')}`;

    // 7. Customer Deduplication & History Updates (Mandatory)
    const normalized = normalizeMobile(rawMobile);
    const customerDoc = await Customer.findOneAndUpdate(
      { normalizedMobile: normalized },
      {
        $set: {
          name: rawName,
          mobile: rawMobile,
          lastVisitAt: new Date(),
        },
        $inc: {
          totalBills: 1,
          totalSpent: grandTotalRupees,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    const customerSnapshot = {
      name: rawName,
      mobile: rawMobile,
    };

    // 8. Create Bill Record
    const bill = await Bill.create({
      billNumber,
      clientRequestId: clientRequestId || undefined,
      outletId: outlet ? outlet._id : null,
      createdBy: req.user._id,
      customerId: customerDoc ? customerDoc._id : null,
      customerSnapshot,
      items: validatedItems,
      subtotal: subtotalRupees,
      discount: discountRupees,
      discountType: dType,
      discountValue: dVal,
      taxPercentage,
      tax: taxRupees,
      grandTotal: grandTotalRupees,
      paymentMethod,
      notes: notes ? notes.trim() : '',
      status: BILL_STATUS.COMPLETED,
    });

    await bill.populate([
      { path: 'outletId', select: 'name code address phone taxPercentage currency' },
      { path: 'createdBy', select: 'name email' },
    ]);

    // 9. Generate WhatsApp Link
    const outletSuffix = outlet?.name ? ` (${outlet.name})` : '';
    let whatsappText = settings.defaultWhatsAppMessage ||
      `Hello {{customerName}},\n\nThank you for dining with {{restaurantName}}${outletSuffix}!\n\nYour bill {{billNumber}} has been generated.\nTotal: {{currency}}{{grandTotal}}\nDate: {{date}}\n\nVisit again soon!`;

    whatsappText = whatsappText
      .replace(/{{customerName}}/g, customerSnapshot.name)
      .replace(/{{restaurantName}}/g, restaurantName)
      .replace(/\s*\({{outletName}}\)/g, outletSuffix)
      .replace(/{{outletName}}/g, outlet?.name || '')
      .replace(/{{billNumber}}/g, bill.billNumber)
      .replace(/{{grandTotal}}/g, `${outlet?.currency || 'Rs. '}${bill.grandTotal}`)
      .replace(/{{currency}}/g, outlet?.currency || 'Rs. ')
      .replace(/{{date}}/g, new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));

    const normalizedMobile = customerDoc
      ? customerDoc.normalizedMobile
      : customer.mobile
      ? normalizeMobile(customer.mobile)
      : '';

    const whatsappLink = normalizedMobile
      ? generateWhatsAppLink(normalizedMobile, whatsappText)
      : '';

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        bill,
        whatsappLink,
        whatsappText,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bills
 * @desc    Get paginated bills with outlet access controls and filters
 * @access  Private
 */
const getBills = async (req, res, next) => {
  try {
    const {
      outletId,
      createdBy,
      paymentMethod,
      status,
      dateRange,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Outlet Isolation & Role Access
    if (req.user.role === ROLES.STAFF) {
      const allowedOutlets = (req.user.outlets && req.user.outlets.length > 0)
        ? req.user.outlets.map((o) => o._id || o)
        : (req.user.outletId ? [req.user.outletId._id || req.user.outletId] : []);
      if (outletId) {
        query.outletId = outletId === 'none' ? null : outletId;
      } else if (allowedOutlets.length > 0) {
        query.$or = [{ outletId: { $in: allowedOutlets } }, { createdBy: req.user._id }];
      } else {
        query.createdBy = req.user._id;
      }
      if (req.query.myOnly === 'true') {
        query.createdBy = req.user._id;
      }
    } else if (req.user.role === ROLES.MANAGER) {
      const allowedOutlets = (req.user.outlets && req.user.outlets.length > 0)
        ? req.user.outlets.map((o) => o._id || o)
        : (req.user.outletId ? [req.user.outletId._id || req.user.outletId] : []);
      if (outletId) {
        query.outletId = outletId === 'none' ? null : outletId;
      } else if (allowedOutlets.length > 0) {
        query.$or = [{ outletId: { $in: allowedOutlets } }, { createdBy: req.user._id }];
      } else {
        query.createdBy = req.user._id;
      }
    } else if (req.user.role === ROLES.ADMIN) {
      if (outletId) {
        query.outletId = outletId === 'none' ? null : outletId;
      }
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (status) {
      query.status = status;
    }

    // Date Filters
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: start, $lte: end };
    } else if (dateRange === 'yesterday') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const start = new Date(yesterday.setHours(0, 0, 0, 0));
      const end = new Date(yesterday.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: start, $lte: end };
    } else if (dateRange === 'thisWeek') {
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
    } else if (dateRange === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: start };
    } else if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // Search by billNumber, customer mobile, or customer name
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { billNumber: searchRegex },
        { 'customerSnapshot.mobile': searchRegex },
        { 'customerSnapshot.name': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate('outletId', 'name code currency')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Bill.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bills,
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
 * @route   GET /api/bills/:id
 * @desc    Get complete single bill snapshot
 * @access  Private
 */
const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('outletId', 'name code address phone taxPercentage currency')
      .populate('createdBy', 'name email phone')
      .populate('customerId', 'name mobile email totalBills totalSpent');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
        errorCode: 'BILL_NOT_FOUND',
      });
    }

    // Role access check
    if (req.user.role !== ROLES.ADMIN) {
      const allowedOutlets = (req.user.outlets && req.user.outlets.length > 0)
        ? req.user.outlets.map((o) => (o._id || o).toString())
        : (req.user.outletId ? [(req.user.outletId._id || req.user.outletId).toString()] : []);
      const billOutletStr = bill.outletId ? (bill.outletId._id || bill.outletId).toString() : null;
      const isCreator = bill.createdBy && (bill.createdBy._id || bill.createdBy).toString() === req.user._id.toString();

      if (billOutletStr && !allowedOutlets.includes(billOutletStr) && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to bills from other outlets.',
          errorCode: 'OUTLET_ACCESS_DENIED',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/bills/:id/cancel
 * @desc    Cancel a bill with reason (audit-logged, never hard deleted)
 * @access  Private (Admin & Manager)
 */
const cancelBill = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
        errorCode: 'BILL_NOT_FOUND',
      });
    }

    if (bill.status === BILL_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Bill is already cancelled.',
        errorCode: 'ALREADY_CANCELLED',
      });
    }

    bill.status = BILL_STATUS.CANCELLED;
    bill.cancelledAt = new Date();
    bill.cancelledBy = req.user._id;
    bill.cancellationReason = reason ? reason.trim() : 'Cancelled by staff/admin';
    await bill.save();

    // Revert customer statistics if customer was attached
    if (bill.customerId) {
      await Customer.findByIdAndUpdate(bill.customerId, {
        $inc: {
          totalBills: -1,
          totalSpent: -bill.grandTotal,
        },
      });
    }

    // Audit log
    await AuditLog.create({
      action: 'BILL_CANCELLED',
      performedBy: req.user._id,
      outletId: bill.outletId,
      details: {
        billId: bill._id,
        billNumber: bill.billNumber,
        grandTotal: bill.grandTotal,
        reason: bill.cancellationReason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully.',
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/bills/:id
 * @desc    Permanently delete a bill from the database (Admin only)
 * @access  Private (Admin only)
 */
const deleteBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.',
        errorCode: 'BILL_NOT_FOUND',
      });
    }

    // Revert customer statistics if bill was not already cancelled
    if (bill.status !== BILL_STATUS.CANCELLED && bill.customerId) {
      await Customer.findByIdAndUpdate(bill.customerId, {
        $inc: {
          totalBills: -1,
          totalSpent: -bill.grandTotal,
        },
      });
    }

    // Audit log for deletion
    await AuditLog.create({
      action: 'BILL_DELETED',
      performedBy: req.user._id,
      outletId: bill.outletId,
      details: {
        billId: bill._id,
        billNumber: bill.billNumber,
        grandTotal: bill.grandTotal,
        customerName: bill.customerSnapshot?.name,
        customerMobile: bill.customerSnapshot?.mobile,
        deletedByAdmin: req.user.email || req.user.name,
      },
    });

    await Bill.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Bill ${bill.billNumber} has been permanently deleted.`,
      data: {
        billId: bill._id,
        billNumber: bill.billNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/bills/:id
 * @desc    Edit existing bill (modify items, quantities, customer, discount, payment method)
 * @access  Private (Staff for own outlet, Manager, Admin)
 */
const updateBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      customer = {},
      items = [],
      discount,
      discountType = 'flat',
      discountValue,
      paymentMethod,
      notes,
    } = req.body;

    const bill = await Bill.findById(id).populate('outletId');
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.',
        errorCode: 'BILL_NOT_FOUND',
      });
    }

    if (bill.status === BILL_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a cancelled bill.',
        errorCode: 'CANNOT_EDIT_CANCELLED_BILL',
      });
    }

    // Role and outlet access check
    if (req.user.role !== ROLES.ADMIN) {
      const allowedOutlets = (req.user.outlets && req.user.outlets.length > 0)
        ? req.user.outlets.map((o) => (o._id || o).toString())
        : (req.user.outletId ? [(req.user.outletId._id || req.user.outletId).toString()] : []);
      const billOutletStr = bill.outletId ? (bill.outletId._id || bill.outletId).toString() : null;
      const isCreator = bill.createdBy && (bill.createdBy._id || bill.createdBy).toString() === req.user._id.toString();

      if (billOutletStr && !allowedOutlets.includes(billOutletStr) && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot edit bills from another outlet.',
          errorCode: 'OUTLET_ACCESS_DENIED',
        });
      }
    }

    const oldGrandTotal = bill.grandTotal;

    // 1. Recalculate Items if items array provided
    if (Array.isArray(items) && items.length > 0) {
      const validatedItems = [];
      let subtotalPaise = 0;

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Item quantity must be a positive integer.',
            errorCode: 'INVALID_QUANTITY',
          });
        }

        // Manual / Custom item
        if (item.isCustom || !item.productId) {
          const customName = (item.productName || item.name || '').trim();
          if (!customName) {
            return res.status(400).json({
              success: false,
              message: 'Manual food item must have a name.',
              errorCode: 'INVALID_CUSTOM_ITEM_NAME',
            });
          }
          const unitPriceRupees = Math.max(0, Number(item.unitPrice !== undefined ? item.unitPrice : item.price) || 0);
          const lineTotalPaise = calculateLineTotalPaise(unitPriceRupees, qty);
          subtotalPaise += lineTotalPaise;

          validatedItems.push({
            productId: null,
            variantId: null,
            productName: customName,
            variantName: (item.variantName || 'Special / Manual').trim(),
            quantity: qty,
            unit: item.unit || 'unit',
            unitPrice: unitPriceRupees,
            lineTotal: toRupees(lineTotalPaise),
            isCustom: true,
          });
          continue;
        }

        if (!item.variantId) {
          return res.status(400).json({
            success: false,
            message: 'Catalog item must have a valid variantId.',
            errorCode: 'INVALID_ITEM_SPEC',
          });
        }

        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: 'Product not found.',
            errorCode: 'PRODUCT_NOT_FOUND',
          });
        }

        const variant = product.variants.id(item.variantId);
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Variant not found for ${product.name}.`,
            errorCode: 'VARIANT_NOT_FOUND',
          });
        }

        const unitPriceRupees = item.unitPrice !== undefined ? Number(item.unitPrice) : variant.price;
        const lineTotalPaise = calculateLineTotalPaise(unitPriceRupees, qty);
        subtotalPaise += lineTotalPaise;

        validatedItems.push({
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          variantName: variant.name,
          quantity: qty,
          unit: variant.unit || 'plate',
          unitPrice: unitPriceRupees,
          lineTotal: toRupees(lineTotalPaise),
          isCustom: false,
        });
      }

      bill.items = validatedItems;
      bill.subtotal = toRupees(subtotalPaise);
    }

    const subtotalPaise = toPaise(bill.subtotal);

    // 2. Discount & Tax Recalculation
    const dType = discountType !== undefined ? discountType : (bill.discountType || 'flat');
    const dVal = Number(
      discountValue !== undefined && discountValue !== ''
        ? discountValue
        : discount !== undefined && discount !== ''
        ? discount
        : bill.discountValue || bill.discount || 0
    );

    let discountPaise = 0;
    if (dType === 'percentage') {
      const pct = Math.max(0, Math.min(100, dVal));
      discountPaise = Math.round((subtotalPaise * pct) / 100);
    } else {
      discountPaise = Math.min(toPaise(dVal), subtotalPaise);
    }

    const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
    const taxPercentage = Number(bill.taxPercentage || bill.outletId?.taxPercentage || 0);
    const taxPaise = calculateTaxPaise(taxablePaise, taxPercentage);
    const grandTotalPaise = taxablePaise + taxPaise;

    bill.discount = toRupees(discountPaise);
    bill.discountType = dType;
    bill.discountValue = dVal;
    bill.tax = toRupees(taxPaise);
    bill.grandTotal = toRupees(grandTotalPaise);

    // 3. Customer Info Update (Mandatory)
    if (customer.name !== undefined || customer.mobile !== undefined) {
      const custName = customer.name !== undefined ? String(customer.name).trim() : bill.customerSnapshot.name;
      const custMobile = customer.mobile !== undefined ? String(customer.mobile).trim() : bill.customerSnapshot.mobile;

      if (!custMobile || custMobile.replace(/\D/g, '').length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Customer mobile number is mandatory (minimum 10 digits required).',
          errorCode: 'CUSTOMER_MOBILE_REQUIRED',
        });
      }

      if (!custName) {
        return res.status(400).json({
          success: false,
          message: 'Customer name is mandatory.',
          errorCode: 'CUSTOMER_NAME_REQUIRED',
        });
      }

      bill.customerSnapshot = {
        name: custName,
        mobile: custMobile,
      };

      const normalized = normalizeMobile(custMobile);
      const customerDoc = await Customer.findOneAndUpdate(
        { normalizedMobile: normalized },
        {
          $set: {
            name: custName,
            mobile: custMobile,
            lastVisitAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      bill.customerId = customerDoc._id;
    }

    // 4. Payment Method & Notes
    if (paymentMethod) {
      bill.paymentMethod = paymentMethod;
    }
    if (notes !== undefined) {
      bill.notes = notes.trim();
    }

    await bill.save();

    // 5. Update Customer Total Spent Difference
    if (bill.customerId) {
      const diff = bill.grandTotal - oldGrandTotal;
      if (diff !== 0) {
        await Customer.findByIdAndUpdate(bill.customerId, {
          $inc: { totalSpent: diff },
        });
      }
    }

    // 6. Audit Log
    await AuditLog.create({
      action: 'BILL_EDITED',
      performedBy: req.user._id,
      outletId: bill.outletId?._id,
      details: {
        billId: bill._id,
        billNumber: bill.billNumber,
        oldTotal: oldGrandTotal,
        newTotal: bill.grandTotal,
      },
    });

    await bill.populate([
      { path: 'outletId', select: 'name code address phone taxPercentage currency' },
      { path: 'createdBy', select: 'name email' },
    ]);

    // 7. Refresh WhatsApp Link
    const settings = (await Setting.findOne({ key: 'general' })) || {};
    const restaurantName = settings.restaurantName || 'Taraaang Organic Food PVT LTD';

    let whatsappText = settings.defaultWhatsAppMessage ||
      'Hello {{customerName}},\n\nThank you for dining at {{restaurantName}} ({{outletName}})!\n\nYour bill: *{{billNumber}}*\nTotal: *{{grandTotal}}*\nDate: {{date}}\n\nVisit again soon!';

    const outlet = bill.outletId;
    whatsappText = whatsappText
      .replace(/{{customerName}}/g, bill.customerSnapshot?.name || 'Guest')
      .replace(/{{restaurantName}}/g, restaurantName)
      .replace(/{{outletName}}/g, outlet?.name || 'Restaurant')
      .replace(/{{billNumber}}/g, bill.billNumber)
      .replace(/{{grandTotal}}/g, `${outlet?.currency || 'Rs.'} ${bill.grandTotal.toFixed(2)}`)
      .replace(/{{currency}}/g, outlet?.currency || 'Rs.')
      .replace(/{{date}}/g, new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));

    const normalizedMobile = bill.customerSnapshot?.mobile
      ? normalizeMobile(bill.customerSnapshot.mobile)
      : '';

    const whatsappLink = normalizedMobile
      ? generateWhatsAppLink(normalizedMobile, whatsappText)
      : '';

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully.',
      data: {
        bill,
        whatsappLink,
        whatsappText,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  cancelBill,
  deleteBill,
};

