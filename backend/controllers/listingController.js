const prisma = require('../config/db');

const createListing = async (req, res) => {
  try {
    const { title, description, price, category, images, legalAffirmation } = req.body;
    const userId = req.user.id;
    const condominiumId = req.user.condominiumId; // Scoped by user residence

    // Check if user is a verified seller
    const seller = await prisma.seller.findUnique({
      where: { userId }
    });

    if (!seller || seller.verificationStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'Only verified sellers can create listings.' });
    }

    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: 'All fields (title, description, price, category) are required.' });
    }

    if (!legalAffirmation) {
      return res.status(400).json({ error: 'You must certify that you are legally allowed to sell this item under Thai law.' });
    }

    const listing = await prisma.listing.create({
      data: {
        condominiumId,
        sellerId: seller.id,
        title,
        description,
        price: parseFloat(price),
        category,
        images: images || [],
        legalAffirmation,
        status: 'PENDING_APPROVAL'
      }
    });

    return res.status(201).json({
      message: 'Listing created successfully and sent to moderation queue.',
      listing
    });
  } catch (error) {
    console.error('Create Listing Error:', error);
    return res.status(500).json({ error: 'Internal server error during listing creation.' });
  }
};

const getListings = async (req, res) => {
  try {
    const { category, search } = req.query;
    const condominiumId = req.condoId; // Injected by tenantMiddleware

    const whereClause = {
      condominiumId,
      status: 'ACTIVE'
    };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            user: {
              select: {
                id: true,
                fullName: true,
                roomNumber: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(listings);
  } catch (error) {
    console.error('Fetch Listings Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching listings.' });
  }
};

const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                roomNumber: true
              }
            },
            reviews: {
              include: {
                reviewer: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!listing || listing.status === 'DELETED') {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    return res.json(listing);
  } catch (error) {
    console.error('Fetch Listing Details Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, images } = req.body;
    const userId = req.user.id;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!listing || listing.status === 'DELETED') {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Ensure user matches boundaries
    if (listing.seller.userId !== userId && req.user.role !== 'SYSTEM_ADMIN' && req.user.role !== 'CONDO_ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to edit this listing.' });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        category,
        images,
        status: (req.user.role === 'SYSTEM_ADMIN' || req.user.role === 'CONDO_ADMIN') ? listing.status : 'PENDING_APPROVAL'
      }
    });

    return res.json({
      message: 'Listing updated successfully.',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update Listing Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true }
    });

    if (!listing || listing.status === 'DELETED') {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.seller.userId !== userId && req.user.role !== 'SYSTEM_ADMIN' && req.user.role !== 'CONDO_ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to delete this listing.' });
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'DELETED' }
    });

    return res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    console.error('Delete Listing Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing || listing.status === 'DELETED') {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId: id
        }
      }
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: {
          userId_listingId: {
            userId,
            listingId: id
          }
        }
      });
      return res.json({ message: 'Listing removed from favorites.', favorited: false });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId,
          listingId: id
        }
      });
      return res.json({ message: 'Listing added to favorites.', favorited: true });
    }
  } catch (error) {
    console.error('Toggle Favorite Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                shopName: true,
                user: { select: { fullName: true } }
              }
            }
          }
        }
      }
    });

    const listings = favorites.map(f => f.listing);
    return res.json(listings);
  } catch (error) {
    console.error('Get Favorites Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  toggleFavorite,
  getFavorites
};
