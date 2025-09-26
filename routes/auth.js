
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, logout } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);
router.post('/logout', auth, logout);

module.exports = router;
