const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
