const express = require('express');
const router = express.Router();
const {
  createCondo,
  submitReport,
  getPendingSellers,
  verifySeller,
  getPendingListings,
  moderateListing,
  suspendUser,
  getReports,
  resolveReport,
  getAuditLogs
} = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Reports can be submitted by any logged in resident user
router.post('/report', authenticateToken, submitReport);

// Global Onboarding Endpoint restricted to SYSTEM_ADMIN
router.post('/condos', authenticateToken, requireRole(['SYSTEM_ADMIN']), createCondo);

// Tenant-specific Moderator actions (restritced to SYSTEM_ADMIN or CONDO_ADMIN)
const allowedAdmins = requireRole(['SYSTEM_ADMIN', 'CONDO_ADMIN']);

router.get('/sellers/pending', authenticateToken, allowedAdmins, getPendingSellers);
router.put('/sellers/:id/verify', authenticateToken, allowedAdmins, verifySeller);
router.get('/listings/pending', authenticateToken, allowedAdmins, getPendingListings);
router.put('/listings/:id/moderate', authenticateToken, allowedAdmins, moderateListing);
router.put('/users/:id/suspend', authenticateToken, allowedAdmins, suspendUser);
router.get('/reports', authenticateToken, allowedAdmins, getReports);
router.put('/reports/:id/resolve', authenticateToken, allowedAdmins, resolveReport);
router.get('/audit-logs', authenticateToken, allowedAdmins, getAuditLogs);

module.exports = router;
