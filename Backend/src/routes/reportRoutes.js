const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getOutletReport,
  getSalesReport,
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER));

router.get('/dashboard', getDashboardSummary);
router.get('/outlet/:id', getOutletReport);
router.get('/sales', getSalesReport);

module.exports = router;
