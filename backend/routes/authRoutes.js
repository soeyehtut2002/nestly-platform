const express = require('express');
const router = express.Router();
const { 
  getCondos, 
  register, 
  login, 
  refresh, 
  logout, 
  getProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const { authLimiter } = require('../middleware/limiter');

// Public route to select active condominium
router.get('/condos', getCondos);

// Auth endpoints require condo context header (X-Condo-ID) and rate limits
router.post('/register', tenantMiddleware, authLimiter, register);
router.post('/login', tenantMiddleware, authLimiter, login);

// Verification and Reset endpoints
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', tenantMiddleware, authLimiter, resendVerificationEmail);
router.post('/forgot-password', tenantMiddleware, authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Refresh and Logout endpoints
router.post('/refresh', refresh);
router.post('/logout', logout);

// Profile endpoint requires active JWT validation
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
