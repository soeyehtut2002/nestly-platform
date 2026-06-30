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
  getAuditLogs,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllUsers,
  updateUserRole,
  getAllCondos,
  updateCondoStatus
} = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public Ad Banners Endpoint
router.get('/banners', getBanners);

// Reports can be submitted by any logged in resident user
router.post('/report', authenticateToken, submitReport);

// Global Onboarding Endpoint restricted to SYSTEM_ADMIN
router.post('/condos', authenticateToken, requireRole(['SYSTEM_ADMIN']), createCondo);

// Super Admin Management Endpoints
router.get('/users', authenticateToken, requireRole(['SYSTEM_ADMIN']), getAllUsers);
router.put('/users/:id/role', authenticateToken, requireRole(['SYSTEM_ADMIN']), updateUserRole);
router.get('/condos/all', authenticateToken, requireRole(['SYSTEM_ADMIN']), getAllCondos);
router.put('/condos/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), updateCondoStatus);
router.post('/banners', authenticateToken, requireRole(['SYSTEM_ADMIN']), createBanner);
router.put('/banners/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), updateBanner);
router.delete('/banners/:id', authenticateToken, requireRole(['SYSTEM_ADMIN']), deleteBanner);

// Tenant-specific Moderator actions (restricted to SYSTEM_ADMIN or CONDO_ADMIN)
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
