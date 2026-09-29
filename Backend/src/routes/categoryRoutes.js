const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', getCategories);

// Admin only actions
router.post('/', authorize(ROLES.ADMIN), createCategory);
router.put('/:id', authorize(ROLES.ADMIN), updateCategory);
router.delete('/:id', authorize(ROLES.ADMIN), deleteCategory);

module.exports = router;
