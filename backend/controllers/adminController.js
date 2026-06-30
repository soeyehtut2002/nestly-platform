const prisma = require('../config/db');

// Global SaaS Admin: Onboard a new condominium
const createCondo = async (req, res) => {
  try {
    const { name, address, province } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Condominium name and address are required.' });
    }

    const condo = await prisma.condominium.create({
      data: { name, address, province: province || 'Bangkok' }
    });

    // Log the onboarding
    await prisma.auditLog.create({
      data: {
        condominiumId: condo.id,
        adminId: req.user.id,
        actionType: 'CREATE_CONDO',
        targetId: `Condo-${condo.id}`,
        details: `Onboarded new condominium tenant: "${name}"`
      }
    });

    return res.status(201).json({
      message: 'Condominium onboarded successfully.',
      condo
    });
  } catch (error) {
    console.error('Onboard Condo Error:', error);
    return res.status(500).json({ error: 'Internal server error onboarding condominium.' });
  }
};

// Resident: Submit abuse report (scopeless, but logs user's condo)
const submitReport = async (req, res) => {
  try {
    const { reportedUserId, reportedListingId, reason } = req.body;
    const reporterId = req.user.id;
    const condominiumId = req.user.condominiumId; // Scoped by reporter's location

    if (!reason) {
      return res.status(400).json({ error: 'Reason for report is required.' });
    }

    const report = await prisma.report.create({
      data: {
        condominiumId,
        reporterId,
        reportedUserId: reportedUserId || null,
        reportedListingId: reportedListingId || null,
        reason
      }
    });

    return res.status(201).json({
      message: 'Report submitted successfully. Administrators will review it.',
      report
    });
  } catch (error) {
    console.error('Submit Report Error:', error);
    return res.status(500).json({ error: 'Internal server error submitting report.' });
  }
};

// Admin: Get pending sellers (tenant-scoped)
const getPendingSellers = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    const condominiumId = isSystemAdmin ? undefined : req.user.condominiumId;

    const pendingSellers = await prisma.seller.findMany({
      where: {
        verificationStatus: 'PENDING',
        condominiumId: condominiumId // filter if not System Admin
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            roomNumber: true,
            phoneNumber: true
          }
        }
      }
    });
    return res.json(pendingSellers);
  } catch (error) {
    console.error('Get Pending Sellers Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Verify seller (Approve / Reject) (Tenant Boundary check)
const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status.' });
    }

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller application not found.' });
    }

    // Verify admin boundary
    if (seller.condominiumId !== req.user.condominiumId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized boundary operation.' });
    }

    const updatedSeller = await prisma.seller.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedAt: new Date(),
        verifiedBy: req.user.id
      }
    });

    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: seller.userId },
        data: { role: 'SELLER' }
      });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        condominiumId: seller.condominiumId,
        adminId: req.user.id,
        actionType: status === 'APPROVED' ? 'VERIFY_SELLER_APPROVE' : 'VERIFY_SELLER_REJECT',
        targetId: `Seller-${id}`,
        details: `Seller shop: "${seller.shopName}". Action: ${status}. Reason: ${reason}`
      }
    });

    return res.json({
      message: `Seller status updated to ${status}.`,
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Verify Seller Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Get pending listings (tenant-scoped)
const getPendingListings = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    const condominiumId = isSystemAdmin ? undefined : req.user.condominiumId;

    const pendingListings = await prisma.listing.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        condominiumId: condominiumId // filter if not System Admin
      },
      include: {
        seller: {
          select: {
            shopName: true,
            user: { select: { fullName: true, roomNumber: true } }
          }
        }
      }
    });
    return res.json(pendingListings);
  } catch (error) {
    console.error('Get Pending Listings Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Moderate listing (Approve / Reject) (Tenant boundary check)
const moderateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['ACTIVE', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid listing status.' });
    }

    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.condominiumId !== req.user.condominiumId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized boundary operation.' });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { status }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        condominiumId: listing.condominiumId,
        adminId: req.user.id,
        actionType: status === 'ACTIVE' ? 'APPROVE_LISTING' : 'REJECT_LISTING',
        targetId: `Listing-${id}`,
        details: `Listing title: "${listing.title}". Decision: ${status}. Reason: ${reason || 'None'}`
      }
    });

    return res.json({
      message: `Listing status updated to ${status}.`,
      listing: updatedListing
    });
  } catch (error) {
    console.error('Moderate Listing Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Suspend User (Tenant boundary check)
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Cannot suspend a global system administrator.' });
    }

    if (user.condominiumId !== req.user.condominiumId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized boundary operation.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isSuspended: suspend }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        condominiumId: user.condominiumId,
        adminId: req.user.id,
        actionType: suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        targetId: `User-${id}`,
        details: `User email: "${user.email}". Reason: ${reason || 'None'}`
      }
    });

    return res.json({
      message: `User suspension status updated to ${suspend}.`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Suspend User Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Get all abuse reports filed (tenant-scoped)
const getReports = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    const condominiumId = isSystemAdmin ? undefined : req.user.condominiumId;

    const reports = await prisma.report.findMany({
      where: {
        condominiumId: condominiumId // filter if not System Admin
      },
      include: {
        reporter: { select: { fullName: true, roomNumber: true } },
        reportedUser: { select: { fullName: true, roomNumber: true, email: true } },
        reportedListing: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(reports);
  } catch (error) {
    console.error('Get Reports Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Resolve report (Tenant boundary check)
const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    if (report.condominiumId !== req.user.condominiumId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized boundary operation.' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        resolutionNotes: notes,
        resolvedById: req.user.id
      }
    });

    return res.json({
      message: `Report status updated to ${status}.`,
      report: updatedReport
    });
  } catch (error) {
    console.error('Resolve Report Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Admin: Get audit logs (tenant-scoped)
const getAuditLogs = async (req, res) => {
  try {
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    const condominiumId = isSystemAdmin ? undefined : req.user.condominiumId;

    const whereClause = {};
    if (!isSystemAdmin) {
      whereClause.condominiumId = condominiumId;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        admin: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// --- Super Admin Capabilities ---

// Public advertisement banners listing
const getBanners = async (req, res) => {
  try {
    const banners = await prisma.adBanner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(banners);
  } catch (error) {
    console.error('Get Banners Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve banners.' });
  }
};

// Create new ad banner
const createBanner = async (req, res) => {
  try {
    const { title, imageUrl, linkUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Banner image URL is required.' });
    
    const banner = await prisma.adBanner.create({
      data: { title, imageUrl, linkUrl }
    });
    return res.status(201).json(banner);
  } catch (error) {
    console.error('Create Banner Error:', error);
    return res.status(500).json({ error: 'Failed to create banner.' });
  }
};

// Update existing ad banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, linkUrl, isActive } = req.body;
    
    const banner = await prisma.adBanner.update({
      where: { id },
      data: { title, imageUrl, linkUrl, isActive }
    });
    return res.json(banner);
  } catch (error) {
    console.error('Update Banner Error:', error);
    return res.status(500).json({ error: 'Failed to update banner.' });
  }
};

// Delete ad banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.adBanner.delete({ where: { id } });
    return res.json({ message: 'Banner deleted successfully.' });
  } catch (error) {
    console.error('Delete Banner Error:', error);
    return res.status(500).json({ error: 'Failed to delete banner.' });
  }
};

// Get all users in the system across all condos
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        roomNumber: true,
        phoneNumber: true,
        role: true,
        isSuspended: true,
        condominium: { select: { name: true } }
      },
      orderBy: { fullName: 'asc' }
    });
    return res.json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

// Update user role (SaaS admin action)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['SYSTEM_ADMIN', 'CONDO_ADMIN', 'RESIDENT', 'SELLER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    
    await prisma.auditLog.create({
      data: {
        condominiumId: user.condominiumId,
        adminId: req.user.id,
        actionType: 'UPDATE_ROLE',
        targetId: `User-${user.id}`,
        details: `Updated user "${user.fullName}" role to: ${role}`
      }
    });
    
    return res.json({ message: 'User role updated successfully.', user });
  } catch (error) {
    console.error('Update User Role Error:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
};

// Get all condominiums in registry
const getAllCondos = async (req, res) => {
  try {
    const condos = await prisma.condominium.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(condos);
  } catch (error) {
    console.error('Get All Condos Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve condos.' });
  }
};

// Update condominium details / toggle active status
const updateCondoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, name, address, province } = req.body;
    
    const condo = await prisma.condominium.update({
      where: { id },
      data: { isActive, name, address, province }
    });
    
    return res.json({ message: 'Condominium updated successfully.', condo });
  } catch (error) {
    console.error('Update Condo Error:', error);
    return res.status(500).json({ error: 'Failed to update condominium.' });
  }
};

module.exports = {
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
};
