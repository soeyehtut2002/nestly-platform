const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/userController');
const { validateRequest, profileUpdateSchema } = require('../middleware/zodSchemas');
const { z } = require('zod');

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateRequest(profileUpdateSchema), updateProfile);

const avatarSchema = z.object({
  avatarUrl: z.string().url('Invalid avatar image URL format.')
});
router.post('/avatar', authenticateToken, validateRequest(avatarSchema), uploadAvatar);

module.exports = router;
