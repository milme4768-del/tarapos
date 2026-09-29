const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorize(ROLES.ADMIN), updateSettings);

module.exports = router;
