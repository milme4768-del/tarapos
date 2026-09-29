const express = require('express');
const router = express.Router();
const {
  createBill,
  getBills,
  getBillById,
  updateBill,
  cancelBill,
} = require('../controllers/billController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.post('/', createBill);
router.get('/', getBills);
router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.post('/:id/cancel', authorize(ROLES.ADMIN, ROLES.MANAGER), cancelBill);

module.exports = router;
