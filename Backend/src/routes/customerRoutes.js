const express = require('express');
const router = express.Router();
const {
  getCustomers,
  lookupCustomer,
  getCustomerById,
} = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCustomers);
router.get('/lookup', lookupCustomer);
router.get('/:id', getCustomerById);

module.exports = router;
