const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Outlet = require('../models/Outlet');
const Customer = require('../models/Customer');
const { BILL_STATUS, ROLES } = require('../constants/roles');

/**
 * Helper to construct date range object
 */
const getDateRangeFilter = (dateRange, startDate, endDate) => {
  const now = new Date();
  if (dateRange === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (dateRange === 'yesterday') {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (dateRange === 'thisWeek') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { $gte: start };
  }
  if (dateRange === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { $gte: start };
  }
  if (startDate && endDate) {
    return {
      $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  }
  return null;
};

/**
 * @route   GET /api/reports/dashboard
 * @desc    Top metrics, outlet-wise sales, and recent bills for Admin/Manager
 * @access  Private (Admin & Manager)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const baseMatch = {
      status: BILL_STATUS.COMPLETED,
    };

    if (req.user.role !== ROLES.ADMIN) {
      baseMatch.outletId = new mongoose.Types.ObjectId(req.user.outletId._id || req.user.outletId);
    }

    const todayMatch = {
      ...baseMatch,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    };

    // 1. Today's Totals (Sales & Bill Count)
    const todayAggregation = await Bill.aggregate([
      { $match: todayMatch },
      {
        $group: {
          _id: null,
          todaySales: { $sum: '$grandTotal' },
          todayBills: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customerSnapshot.mobile' },
        },
      },
    ]);

    const todaySales = todayAggregation[0]?.todaySales || 0;
    const todayBills = todayAggregation[0]?.todayBills || 0;
    const rawCustomers = todayAggregation[0]?.uniqueCustomers || [];
    const todayCustomers = rawCustomers.filter(Boolean).length;

    // 2. Active Outlets count
    const activeOutlets = await Outlet.countDocuments({ isActive: true });

    // 3. Sales by Outlet (Today & All Time) using aggregation
    const salesByOutlet = await Bill.aggregate([
      {
        $match: {
          status: BILL_STATUS.COMPLETED,
          ...(req.user.role !== ROLES.ADMIN
            ? { outletId: new mongoose.Types.ObjectId(req.user.outletId._id || req.user.outletId) }
            : {}),
        },
      },
      {
        $group: {
          _id: '$outletId',
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 },
          todaySales: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', startOfToday] },
                    { $lte: ['$createdAt', endOfToday] },
                  ],
                },
                '$grandTotal',
                0,
              ],
            },
          },
          todayBills: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', startOfToday] },
                    { $lte: ['$createdAt', endOfToday] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'outlets',
          localField: '_id',
          foreignField: '_id',
          as: 'outlet',
        },
      },
      { $unwind: '$outlet' },
      {
        $project: {
          _id: 1,
          name: '$outlet.name',
          code: '$outlet.code',
          currency: '$outlet.currency',
          totalSales: 1,
          totalBills: 1,
          todaySales: 1,
          todayBills: 1,
        },
      },
      { $sort: { todaySales: -1, totalSales: -1 } },
    ]);

    // 4. Recent 10 bills
    const recentBills = await Bill.find(baseMatch)
      .populate('outletId', 'name code currency')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          todaySales: Number(todaySales.toFixed(2)),
          todayBills,
          todayCustomers,
          activeOutlets,
        },
        salesByOutlet,
        recentBills,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/outlet/:id
 * @desc    Detailed outlet performance and staff breakdown
 * @access  Private (Admin & Manager)
 */
const getOutletReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dateRange = 'today', startDate, endDate } = req.query;

    const outletObjectId = new mongoose.Types.ObjectId(id);

    // Verify access
    if (
      req.user.role !== ROLES.ADMIN &&
      (req.user.outletId._id || req.user.outletId).toString() !== id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this outlet report.',
        errorCode: 'OUTLET_ACCESS_DENIED',
      });
    }

    const outlet = await Outlet.findById(id);
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
        errorCode: 'OUTLET_NOT_FOUND',
      });
    }

    const matchQuery = {
      outletId: outletObjectId,
      status: BILL_STATUS.COMPLETED,
    };

    const dateFilter = getDateRangeFilter(dateRange, startDate, endDate);
    if (dateFilter) {
      matchQuery.createdAt = dateFilter;
    }

    // 1. Overall stats for date range
    const [stats] = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $sum: 1 },
          averageBill: { $avg: '$grandTotal' },
          uniqueCustomers: { $addToSet: '$customerSnapshot.mobile' },
        },
      },
    ]);

    // 2. Staff performance breakdown
    const staffActivity = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$createdBy',
          billsCount: { $sum: 1 },
          totalSales: { $sum: '$grandTotal' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff',
        },
      },
      { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$staff.name', 'Unknown Staff'] },
          email: '$staff.email',
          billsCount: 1,
          totalSales: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    // 3. Payment method breakdown
    const paymentBreakdown = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$grandTotal' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        outlet,
        metrics: {
          totalSales: Number((stats?.totalSales || 0).toFixed(2)),
          totalBills: stats?.totalBills || 0,
          averageBill: Number((stats?.averageBill || 0).toFixed(2)),
          customersCount: (stats?.uniqueCustomers || []).filter(Boolean).length,
        },
        staffActivity,
        paymentBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/sales
 * @desc    Comprehensive sales reports with date range, top items, payment channels
 * @access  Private (Admin & Manager)
 */
const getSalesReport = async (req, res, next) => {
  try {
    const { outletId, dateRange = 'thisMonth', startDate, endDate } = req.query;

    const matchQuery = {
      status: BILL_STATUS.COMPLETED,
    };

    if (req.user.role !== ROLES.ADMIN) {
      matchQuery.outletId = new mongoose.Types.ObjectId(req.user.outletId._id || req.user.outletId);
    } else if (outletId) {
      matchQuery.outletId = new mongoose.Types.ObjectId(outletId);
    }

    const dateFilter = getDateRangeFilter(dateRange, startDate, endDate);
    if (dateFilter) {
      matchQuery.createdAt = dateFilter;
    }

    // 1. Payment Method Breakdown
    const paymentBreakdown = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$grandTotal' },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // 2. Top-selling food items and variants
    const topItems = await Bill.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            variantName: '$items.variantName',
            productName: '$items.productName',
            unit: '$items.unit',
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
        },
      },
      {
        $project: {
          _id: 0,
          productName: '$_id.productName',
          variantName: '$_id.variantName',
          unit: '$_id.unit',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 15 },
    ]);

    // 3. Daily Sales Trend
    const dailyTrend = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: { $sum: '$grandTotal' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        paymentBreakdown,
        topItems,
        dailyTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getOutletReport,
  getSalesReport,
};
