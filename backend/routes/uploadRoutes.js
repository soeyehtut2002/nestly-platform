const express = require('express');
const router = express.Router();
const { getUploadSignature } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Secured endpoint requiring a valid JWT session token
router.post('/signature', authenticateToken, getUploadSignature);

module.exports = router;
