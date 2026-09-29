const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', getProducts);
router.get('/catalog', getProducts);
router.get('/:id', getProductById);

// Admin only actions
router.post('/', authorize(ROLES.ADMIN), createProduct);
router.put('/:id', authorize(ROLES.ADMIN), updateProduct);
router.delete('/:id', authorize(ROLES.ADMIN), deleteProduct);

module.exports = router;
