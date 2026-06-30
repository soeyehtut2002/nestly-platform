const express = require('express');
const router = express.Router();
const { applySeller, getSellerProfile, getVerificationStatus } = require('../controllers/sellerController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, sellerVerifySchema } = require('../middleware/zodSchemas');

// Backward compatibility + REST compliant endpoints
router.post('/apply', authenticateToken, validateRequest(sellerVerifySchema), applySeller);
router.post('/verify', authenticateToken, validateRequest(sellerVerifySchema), applySeller);
router.get('/profile', authenticateToken, getSellerProfile);
router.get('/status', authenticateToken, getVerificationStatus);

module.exports = router;
