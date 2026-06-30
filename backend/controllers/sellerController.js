const prisma = require('../config/db');

const applySeller = async (req, res) => {
  try {
    const { shopName, idCardUrl, proofOfResidencyUrl, agreementSigned } = req.body;
    const userId = req.user.id;
    const condominiumId = req.user.condominiumId; // Inherited from verified User context

    if (!shopName) {
      return res.status(400).json({ error: 'Shop name is required.' });
    }

    // Check if user already has a seller profile
    const existingSeller = await prisma.seller.findUnique({
      where: { userId }
    });

    if (existingSeller) {
      if (existingSeller.verificationStatus === 'APPROVED') {
        return res.status(400).json({ error: 'You are already an approved seller.' });
      }
      if (existingSeller.verificationStatus === 'PENDING') {
        return res.status(400).json({ error: 'Your seller application is currently pending admin review.' });
      }
    }

    const sellerData = {
      condominiumId,
      shopName,
      idCardUrl: idCardUrl || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
      proofOfResidencyUrl: proofOfResidencyUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
      agreementSigned: true,
      agreementSignedAt: new Date(),
      verificationStatus: 'PENDING'
    };

    let seller;
    if (existingSeller) {
      seller = await prisma.seller.update({
        where: { userId },
        data: sellerData
      });
    } else {
      seller = await prisma.seller.create({
        data: {
          userId,
          ...sellerData
        }
      });
    }

    return res.status(201).json({
      message: 'Seller application submitted successfully and is awaiting admin review.',
      seller
    });
  } catch (error) {
    console.error('Seller Application Error:', error);
    return res.status(500).json({ error: 'Internal server error during seller application.' });
  }
};

const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        listings: {
          where: { status: { not: 'DELETED' } }
        }
      }
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found.' });
    }

    return res.json(seller);
  } catch (error) {
    console.error('Fetch Seller Profile Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user.id }
    });
    if (!seller) {
      return res.status(404).json({ error: 'No seller profile found.' });
    }
    return res.json({ status: seller.verificationStatus, seller });
  } catch (error) {
    console.error('Get Verification Status Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  applySeller,
  getSellerProfile,
  getVerificationStatus
};
