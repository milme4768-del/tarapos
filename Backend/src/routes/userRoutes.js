const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);

module.exports = router;
