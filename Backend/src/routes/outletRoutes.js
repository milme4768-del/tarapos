const express = require('express');
const router = express.Router();
const {
  getOutlets,
  getOutletById,
  createOutlet,
  updateOutlet,
  toggleOutletStatus,
  getPublicOutlets,
} = require('../controllers/outletController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

// Public route for login page branch display
router.get('/public', getPublicOutlets);

router.use(authenticate);

router.get('/', getOutlets);
router.get('/:id', getOutletById);

// Admin only actions
router.post('/', authorize(ROLES.ADMIN), createOutlet);
router.put('/:id', authorize(ROLES.ADMIN), updateOutlet);
router.patch('/:id/status', authorize(ROLES.ADMIN), toggleOutletStatus);

module.exports = router;
